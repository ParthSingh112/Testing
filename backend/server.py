from fastapi import FastAPI, APIRouter, HTTPException, WebSocket, WebSocketDisconnect, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
import asyncio
import json
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

app = FastAPI()
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, test_id: str):
        await websocket.accept()
        self.active_connections[test_id] = websocket

    def disconnect(self, test_id: str):
        if test_id in self.active_connections:
            del self.active_connections[test_id]

    async def send_message(self, test_id: str, message: dict):
        if test_id in self.active_connections:
            await self.active_connections[test_id].send_json(message)

manager = ConnectionManager()

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    role: str = "tester"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    email: EmailStr
    name: str
    role: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestCase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    name: str
    description: str
    type: str
    steps: List[str]
    expected_result: str
    priority: str = "medium"
    status: str = "active"
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class TestCaseCreate(BaseModel):
    project_id: str
    name: str
    description: str
    type: str
    steps: List[str]
    expected_result: str
    priority: str = "medium"

class TestExecution(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    test_case_id: str
    status: str = "pending"
    start_time: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    end_time: Optional[datetime] = None
    logs: List[str] = []
    screenshots: List[str] = []
    executed_by: str
    result: Optional[str] = None

class TestExecutionCreate(BaseModel):
    test_case_id: str

class TestExecutionUpdate(BaseModel):
    status: Optional[str] = None
    logs: Optional[List[str]] = None
    result: Optional[str] = None

class Bug(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    project_id: str
    test_execution_id: Optional[str] = None
    title: str
    description: str
    severity: str
    status: str = "open"
    reported_by: str
    assigned_to: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class BugCreate(BaseModel):
    project_id: str
    test_execution_id: Optional[str] = None
    title: str
    description: str
    severity: str
    assigned_to: Optional[str] = None

class Project(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    description: str
    team_members: List[str] = []
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ProjectCreate(BaseModel):
    name: str
    description: str

class AITestSuggestion(BaseModel):
    test_case_id: str
    prompt: str

class AIAnalyzeResults(BaseModel):
    test_execution_id: str

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_jwt_token(user_id: str, email: str) -> str:
    payload = {
        'user_id': user_id,
        'email': email,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> Dict[str, Any]:
    token = credentials.credentials
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload['user_id']}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

@api_router.post("/auth/register")
async def register(user_data: UserRegister):
    existing = await db.users.find_one({"email": user_data.email}, {"_id": 0})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(
        email=user_data.email,
        name=user_data.name,
        role=user_data.role
    )
    
    doc = user.model_dump()
    doc['password'] = hash_password(user_data.password)
    doc['created_at'] = doc['created_at'].isoformat()
    
    await db.users.insert_one(doc)
    
    token = create_jwt_token(user.id, user.email)
    return {"token": token, "user": user.model_dump()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user_doc = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user_doc or not verify_password(credentials.password, user_doc['password']):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    user_doc.pop('password')
    if isinstance(user_doc.get('created_at'), str):
        user_doc['created_at'] = datetime.fromisoformat(user_doc['created_at'])
    
    token = create_jwt_token(user_doc['id'], user_doc['email'])
    return {"token": token, "user": user_doc}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project = Project(
        name=project_data.name,
        description=project_data.description,
        created_by=current_user['id'],
        team_members=[current_user['id']]
    )
    
    doc = project.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    await db.projects.insert_one(doc)
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find(
        {"team_members": current_user['id']},
        {"_id": 0}
    ).to_list(1000)
    
    for project in projects:
        if isinstance(project.get('created_at'), str):
            project['created_at'] = datetime.fromisoformat(project['created_at'])
    
    return projects

@api_router.post("/test-cases", response_model=TestCase)
async def create_test_case(test_data: TestCaseCreate, current_user: dict = Depends(get_current_user)):
    test_case = TestCase(
        **test_data.model_dump(),
        created_by=current_user['id']
    )
    
    doc = test_case.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.test_cases.insert_one(doc)
    return test_case

@api_router.get("/test-cases", response_model=List[TestCase])
async def get_test_cases(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query['project_id'] = project_id
    
    test_cases = await db.test_cases.find(query, {"_id": 0}).to_list(1000)
    
    for tc in test_cases:
        if isinstance(tc.get('created_at'), str):
            tc['created_at'] = datetime.fromisoformat(tc['created_at'])
        if isinstance(tc.get('updated_at'), str):
            tc['updated_at'] = datetime.fromisoformat(tc['updated_at'])
    
    return test_cases

@api_router.get("/test-cases/{test_id}", response_model=TestCase)
async def get_test_case(test_id: str, current_user: dict = Depends(get_current_user)):
    test_case = await db.test_cases.find_one({"id": test_id}, {"_id": 0})
    if not test_case:
        raise HTTPException(status_code=404, detail="Test case not found")
    
    if isinstance(test_case.get('created_at'), str):
        test_case['created_at'] = datetime.fromisoformat(test_case['created_at'])
    if isinstance(test_case.get('updated_at'), str):
        test_case['updated_at'] = datetime.fromisoformat(test_case['updated_at'])
    
    return test_case

@api_router.post("/test-executions", response_model=TestExecution)
async def create_test_execution(exec_data: TestExecutionCreate, current_user: dict = Depends(get_current_user)):
    test_execution = TestExecution(
        test_case_id=exec_data.test_case_id,
        executed_by=current_user['id']
    )
    
    doc = test_execution.model_dump()
    doc['start_time'] = doc['start_time'].isoformat()
    await db.test_executions.insert_one(doc)
    return test_execution

@api_router.get("/test-executions", response_model=List[TestExecution])
async def get_test_executions(test_case_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if test_case_id:
        query['test_case_id'] = test_case_id
    
    executions = await db.test_executions.find(query, {"_id": 0}).to_list(1000)
    
    for ex in executions:
        if isinstance(ex.get('start_time'), str):
            ex['start_time'] = datetime.fromisoformat(ex['start_time'])
        if ex.get('end_time') and isinstance(ex['end_time'], str):
            ex['end_time'] = datetime.fromisoformat(ex['end_time'])
    
    return executions

@api_router.get("/test-executions/{exec_id}", response_model=TestExecution)
async def get_test_execution(exec_id: str, current_user: dict = Depends(get_current_user)):
    execution = await db.test_executions.find_one({"id": exec_id}, {"_id": 0})
    if not execution:
        raise HTTPException(status_code=404, detail="Test execution not found")
    
    if isinstance(execution.get('start_time'), str):
        execution['start_time'] = datetime.fromisoformat(execution['start_time'])
    if execution.get('end_time') and isinstance(execution['end_time'], str):
        execution['end_time'] = datetime.fromisoformat(execution['end_time'])
    
    return execution

@api_router.patch("/test-executions/{exec_id}")
async def update_test_execution(exec_id: str, update_data: TestExecutionUpdate, current_user: dict = Depends(get_current_user)):
    update_dict = {k: v for k, v in update_data.model_dump().items() if v is not None}
    
    if update_data.status == "completed" or update_data.status == "failed":
        update_dict['end_time'] = datetime.now(timezone.utc).isoformat()
    
    await db.test_executions.update_one(
        {"id": exec_id},
        {"$set": update_dict}
    )
    
    execution = await db.test_executions.find_one({"id": exec_id}, {"_id": 0})
    await manager.send_message(exec_id, {"type": "update", "data": execution})
    
    return {"message": "Updated successfully"}

@api_router.post("/bugs", response_model=Bug)
async def create_bug(bug_data: BugCreate, current_user: dict = Depends(get_current_user)):
    bug = Bug(
        **bug_data.model_dump(),
        reported_by=current_user['id']
    )
    
    doc = bug.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    await db.bugs.insert_one(doc)
    return bug

@api_router.get("/bugs", response_model=List[Bug])
async def get_bugs(project_id: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    query = {}
    if project_id:
        query['project_id'] = project_id
    
    bugs = await db.bugs.find(query, {"_id": 0}).to_list(1000)
    
    for bug in bugs:
        if isinstance(bug.get('created_at'), str):
            bug['created_at'] = datetime.fromisoformat(bug['created_at'])
        if isinstance(bug.get('updated_at'), str):
            bug['updated_at'] = datetime.fromisoformat(bug['updated_at'])
    
    return bugs

@api_router.get("/stats/dashboard")
async def get_dashboard_stats(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"team_members": current_user['id']}).to_list(1000)
    project_ids = [p['id'] for p in projects]
    
    total_tests = await db.test_cases.count_documents({"project_id": {"$in": project_ids}})
    total_executions = await db.test_executions.count_documents({})
    
    recent_executions = await db.test_executions.find(
        {},
        {"_id": 0}
    ).sort("start_time", -1).limit(10).to_list(10)
    
    for ex in recent_executions:
        if isinstance(ex.get('start_time'), str):
            ex['start_time'] = datetime.fromisoformat(ex['start_time'])
        if ex.get('end_time') and isinstance(ex['end_time'], str):
            ex['end_time'] = datetime.fromisoformat(ex['end_time'])
    
    total_bugs = await db.bugs.count_documents({"project_id": {"$in": project_ids}})
    open_bugs = await db.bugs.count_documents({"project_id": {"$in": project_ids}, "status": "open"})
    
    return {
        "total_tests": total_tests,
        "total_executions": total_executions,
        "recent_executions": recent_executions,
        "total_bugs": total_bugs,
        "open_bugs": open_bugs
    }

@api_router.post("/ai/suggest-tests")
async def suggest_tests(request: AITestSuggestion, current_user: dict = Depends(get_current_user)):
    try:
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"test-suggest-{request.test_case_id}",
            system_message="You are a QA expert. Analyze test cases and suggest improvements, edge cases, and additional test scenarios."
        ).with_model("openai", "gpt-4o")
        
        user_message = UserMessage(text=request.prompt)
        response = await chat.send_message(user_message)
        
        return {"suggestion": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/ai/analyze-results")
async def analyze_results(request: AIAnalyzeResults, current_user: dict = Depends(get_current_user)):
    try:
        execution = await db.test_executions.find_one({"id": request.test_execution_id}, {"_id": 0})
        if not execution:
            raise HTTPException(status_code=404, detail="Test execution not found")
        
        test_case = await db.test_cases.find_one({"id": execution['test_case_id']}, {"_id": 0})
        
        chat = LlmChat(
            api_key=os.environ['EMERGENT_LLM_KEY'],
            session_id=f"analyze-{request.test_execution_id}",
            system_message="You are a QA expert. Analyze test execution results, identify patterns, and provide insights."
        ).with_model("openai", "gpt-4o")
        
        prompt = f"""Analyze this test execution:
Test Case: {test_case['name']}
Description: {test_case['description']}
Expected: {test_case['expected_result']}
Status: {execution['status']}
Result: {execution.get('result', 'N/A')}
Logs: {execution.get('logs', [])}

Provide detailed analysis and recommendations."""
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        
        return {"analysis": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@api_router.websocket("/ws/test-execution/{exec_id}")
async def websocket_endpoint(websocket: WebSocket, exec_id: str):
    await manager.connect(websocket, exec_id)
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message['type'] == 'log':
                await db.test_executions.update_one(
                    {"id": exec_id},
                    {"$push": {"logs": message['content']}}
                )
                await manager.send_message(exec_id, message)
            
    except WebSocketDisconnect:
        manager.disconnect(exec_id)

app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()