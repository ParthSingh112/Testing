import requests
import sys
import json
from datetime import datetime

class DevQAAPITester:
    def __init__(self, base_url="https://devqa-platform-1.preview.emergentagent.com"):
        self.base_url = base_url
        self.token = None
        self.user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.project_id = None
        self.test_case_id = None
        self.execution_id = None
        self.bug_id = None

    def run_test(self, name, method, endpoint, expected_status, data=None, headers=None):
        """Run a single API test"""
        url = f"{self.base_url}/api/{endpoint}"
        test_headers = {'Content-Type': 'application/json'}
        if self.token:
            test_headers['Authorization'] = f'Bearer {self.token}'
        if headers:
            test_headers.update(headers)

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=test_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=test_headers)
            elif method == 'PATCH':
                response = requests.patch(url, json=data, headers=test_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=test_headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    return success, response.json() if response.text else {}
                except:
                    return success, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                print(f"Response: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_user_registration(self):
        """Test user registration"""
        timestamp = datetime.now().strftime('%H%M%S')
        user_data = {
            "email": f"test_user_{timestamp}@devqa.com",
            "password": "TestPass123!",
            "name": f"Test User {timestamp}",
            "role": "tester"
        }
        
        success, response = self.run_test(
            "User Registration",
            "POST",
            "auth/register",
            200,
            data=user_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            print(f"✅ User registered with ID: {self.user_id}")
            return True
        return False

    def test_user_login(self):
        """Test user login with existing credentials"""
        login_data = {
            "email": "test_user@devqa.com",
            "password": "TestPass123!"
        }
        
        success, response = self.run_test(
            "User Login",
            "POST",
            "auth/login",
            200,
            data=login_data
        )
        
        if success and 'token' in response:
            self.token = response['token']
            self.user_id = response['user']['id']
            return True
        return False

    def test_get_current_user(self):
        """Test getting current user info"""
        success, response = self.run_test(
            "Get Current User",
            "GET",
            "auth/me",
            200
        )
        return success

    def test_create_project(self):
        """Test creating a project"""
        project_data = {
            "name": f"Test Project {datetime.now().strftime('%H%M%S')}",
            "description": "A test project for API testing"
        }
        
        success, response = self.run_test(
            "Create Project",
            "POST",
            "projects",
            200,
            data=project_data
        )
        
        if success and 'id' in response:
            self.project_id = response['id']
            print(f"✅ Project created with ID: {self.project_id}")
            return True
        return False

    def test_get_projects(self):
        """Test getting user projects"""
        success, response = self.run_test(
            "Get Projects",
            "GET",
            "projects",
            200
        )
        return success

    def test_create_test_case(self):
        """Test creating a test case"""
        if not self.project_id:
            print("❌ No project ID available for test case creation")
            return False
            
        test_case_data = {
            "project_id": self.project_id,
            "name": f"Test Case {datetime.now().strftime('%H%M%S')}",
            "description": "A sample test case for API testing",
            "type": "functional",
            "steps": [
                "Step 1: Open application",
                "Step 2: Login with valid credentials",
                "Step 3: Navigate to dashboard"
            ],
            "expected_result": "User should be able to access dashboard",
            "priority": "high"
        }
        
        success, response = self.run_test(
            "Create Test Case",
            "POST",
            "test-cases",
            200,
            data=test_case_data
        )
        
        if success and 'id' in response:
            self.test_case_id = response['id']
            print(f"✅ Test case created with ID: {self.test_case_id}")
            return True
        return False

    def test_get_test_cases(self):
        """Test getting test cases"""
        success, response = self.run_test(
            "Get Test Cases",
            "GET",
            "test-cases",
            200
        )
        return success

    def test_get_test_case_by_id(self):
        """Test getting a specific test case"""
        if not self.test_case_id:
            print("❌ No test case ID available")
            return False
            
        success, response = self.run_test(
            "Get Test Case by ID",
            "GET",
            f"test-cases/{self.test_case_id}",
            200
        )
        return success

    def test_create_test_execution(self):
        """Test creating a test execution"""
        if not self.test_case_id:
            print("❌ No test case ID available for execution")
            return False
            
        execution_data = {
            "test_case_id": self.test_case_id
        }
        
        success, response = self.run_test(
            "Create Test Execution",
            "POST",
            "test-executions",
            200,
            data=execution_data
        )
        
        if success and 'id' in response:
            self.execution_id = response['id']
            print(f"✅ Test execution created with ID: {self.execution_id}")
            return True
        return False

    def test_update_test_execution(self):
        """Test updating a test execution"""
        if not self.execution_id:
            print("❌ No execution ID available for update")
            return False
            
        update_data = {
            "status": "completed",
            "result": "Test passed successfully",
            "logs": ["Test started", "All steps completed", "Test passed"]
        }
        
        success, response = self.run_test(
            "Update Test Execution",
            "PATCH",
            f"test-executions/{self.execution_id}",
            200,
            data=update_data
        )
        return success

    def test_get_test_executions(self):
        """Test getting test executions"""
        success, response = self.run_test(
            "Get Test Executions",
            "GET",
            "test-executions",
            200
        )
        return success

    def test_create_bug(self):
        """Test creating a bug report"""
        if not self.project_id:
            print("❌ No project ID available for bug creation")
            return False
            
        bug_data = {
            "project_id": self.project_id,
            "test_execution_id": self.execution_id,
            "title": f"Test Bug {datetime.now().strftime('%H%M%S')}",
            "description": "This is a test bug report for API testing",
            "severity": "medium"
        }
        
        success, response = self.run_test(
            "Create Bug",
            "POST",
            "bugs",
            200,
            data=bug_data
        )
        
        if success and 'id' in response:
            self.bug_id = response['id']
            print(f"✅ Bug created with ID: {self.bug_id}")
            return True
        return False

    def test_get_bugs(self):
        """Test getting bugs"""
        success, response = self.run_test(
            "Get Bugs",
            "GET",
            "bugs",
            200
        )
        return success

    def test_dashboard_stats(self):
        """Test getting dashboard statistics"""
        success, response = self.run_test(
            "Get Dashboard Stats",
            "GET",
            "stats/dashboard",
            200
        )
        return success

    def test_ai_suggest_tests(self):
        """Test AI test suggestions"""
        if not self.test_case_id:
            print("❌ No test case ID available for AI suggestions")
            return False
            
        ai_data = {
            "test_case_id": self.test_case_id,
            "prompt": "Suggest improvements for this login test case"
        }
        
        success, response = self.run_test(
            "AI Test Suggestions",
            "POST",
            "ai/suggest-tests",
            200,
            data=ai_data
        )
        return success

    def test_ai_analyze_results(self):
        """Test AI result analysis"""
        if not self.execution_id:
            print("❌ No execution ID available for AI analysis")
            return False
            
        ai_data = {
            "test_execution_id": self.execution_id
        }
        
        success, response = self.run_test(
            "AI Result Analysis",
            "POST",
            "ai/analyze-results",
            200,
            data=ai_data
        )
        return success

def main():
    print("🚀 Starting DevQA API Testing...")
    tester = DevQAAPITester()
    
    # Test sequence
    tests = [
        ("User Registration", tester.test_user_registration),
        ("Get Current User", tester.test_get_current_user),
        ("Create Project", tester.test_create_project),
        ("Get Projects", tester.test_get_projects),
        ("Create Test Case", tester.test_create_test_case),
        ("Get Test Cases", tester.test_get_test_cases),
        ("Get Test Case by ID", tester.test_get_test_case_by_id),
        ("Create Test Execution", tester.test_create_test_execution),
        ("Update Test Execution", tester.test_update_test_execution),
        ("Get Test Executions", tester.test_get_test_executions),
        ("Create Bug", tester.test_create_bug),
        ("Get Bugs", tester.test_get_bugs),
        ("Dashboard Stats", tester.test_dashboard_stats),
        ("AI Test Suggestions", tester.test_ai_suggest_tests),
        ("AI Result Analysis", tester.test_ai_analyze_results),
    ]
    
    failed_tests = []
    
    for test_name, test_func in tests:
        try:
            if not test_func():
                failed_tests.append(test_name)
        except Exception as e:
            print(f"❌ {test_name} failed with exception: {str(e)}")
            failed_tests.append(test_name)
    
    # Print results
    print(f"\n📊 Test Results:")
    print(f"Tests passed: {tester.tests_passed}/{tester.tests_run}")
    print(f"Success rate: {(tester.tests_passed/tester.tests_run)*100:.1f}%")
    
    if failed_tests:
        print(f"\n❌ Failed tests:")
        for test in failed_tests:
            print(f"  - {test}")
    
    return 0 if tester.tests_passed == tester.tests_run else 1

if __name__ == "__main__":
    sys.exit(main())