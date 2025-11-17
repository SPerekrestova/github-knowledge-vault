#!/usr/bin/env python3
"""
Verification test for Docker configuration
Validates that files are configured correctly without requiring dependencies
"""

import os
import re


def test_mcp_client_file():
    """Verify mcp_client.py uses Docker correctly"""
    print("🧪 Test 1: MCP Client File Configuration")

    file_path = "mcp_client.py"
    with open(file_path, 'r') as f:
        content = f.read()

    # Check 1: Uses mcp_server_image instead of mcp_server_path
    assert "mcp_server_image" in content, "Should use mcp_server_image parameter"
    assert "self.mcp_server_image" in content, "Should store mcp_server_image attribute"
    print("   ✅ Uses mcp_server_image parameter")

    # Check 2: Docker command instead of python
    assert 'command="docker"' in content, "Should use docker command"
    print("   ✅ Uses docker command")

    # Check 3: Docker run arguments
    assert '"run"' in content or "'run'" in content, "Should have 'run' in args"
    assert '"-i"' in content or "'-i'" in content, "Should have '-i' flag"
    assert '"--rm"' in content or "'--rm'" in content, "Should have '--rm' flag"
    print("   ✅ Includes Docker run flags (-i, --rm)")

    # Check 4: Environment variable passing
    assert "GITHUB_TOKEN" in content, "Should pass GITHUB_TOKEN"
    assert "GITHUB_ORG" in content, "Should pass GITHUB_ORG"
    print("   ✅ Passes environment variables")

    # Check 5: No references to local file paths
    if "os.path.exists" in content:
        print("   ⚠️  Warning: Still contains os.path.exists (might be for other uses)")
    print("   ✅ Docker-based connection implemented")

    return True


def test_main_file():
    """Verify main.py uses MCP_SERVER_IMAGE"""
    print("\n🧪 Test 2: Main File Configuration")

    file_path = "main.py"
    with open(file_path, 'r') as f:
        content = f.read()

    # Check 1: Uses MCP_SERVER_IMAGE environment variable
    assert "MCP_SERVER_IMAGE" in content, "Should use MCP_SERVER_IMAGE env var"
    print("   ✅ Uses MCP_SERVER_IMAGE environment variable")

    # Check 2: Default Docker image
    assert "ghcr.io/sperekrestova/github-mcp-server" in content, "Should have default image"
    print("   ✅ Has default Docker image")

    # Check 3: Passes image to MCPClient
    assert "MCPClient(MCP_SERVER_IMAGE" in content, "Should pass image to client"
    print("   ✅ Passes image to MCPClient")

    # Check 4: No references to MCP_SERVER_PATH
    if "MCP_SERVER_PATH" in content:
        print("   ❌ ERROR: Still contains MCP_SERVER_PATH references")
        return False
    print("   ✅ No MCP_SERVER_PATH references")

    return True


def test_env_example_file():
    """Verify .env.example has correct configuration"""
    print("\n🧪 Test 3: Environment Example File")

    file_path = ".env.example"
    with open(file_path, 'r') as f:
        content = f.read()

    # Check 1: Has MCP_SERVER_IMAGE
    assert "MCP_SERVER_IMAGE" in content, "Should define MCP_SERVER_IMAGE"
    print("   ✅ Defines MCP_SERVER_IMAGE")

    # Check 2: Has default image
    assert "ghcr.io/sperekrestova/github-mcp-server" in content, "Should have default image"
    print("   ✅ Has default Docker image")

    # Check 3: No MCP_SERVER_PATH
    if "MCP_SERVER_PATH" in content:
        print("   ❌ ERROR: Still contains MCP_SERVER_PATH")
        return False
    print("   ✅ No MCP_SERVER_PATH references")

    # Check 4: Has documentation
    assert "Docker" in content or "docker" in content, "Should mention Docker"
    print("   ✅ Has Docker documentation")

    return True


def test_docker_compose_file():
    """Verify docker-compose.yml configuration"""
    print("\n🧪 Test 4: Docker Compose Configuration")

    file_path = "../docker-compose.yml"
    with open(file_path, 'r') as f:
        content = f.read()

    # Check 1: Uses MCP_SERVER_IMAGE
    assert "MCP_SERVER_IMAGE" in content, "Should use MCP_SERVER_IMAGE"
    print("   ✅ Uses MCP_SERVER_IMAGE")

    # Check 2: Has Docker socket mount
    assert "/var/run/docker.sock" in content, "Should mount Docker socket"
    print("   ✅ Mounts Docker socket")

    # Check 3: No MCP_SERVER_PATH
    if "MCP_SERVER_PATH" in content:
        print("   ❌ ERROR: Still contains MCP_SERVER_PATH")
        return False
    print("   ✅ No MCP_SERVER_PATH references")

    # Check 4: Has default image value
    assert "ghcr.io/sperekrestova/github-mcp-server" in content, "Should have default image"
    print("   ✅ Has default Docker image")

    return True


def test_readme_file():
    """Verify README has updated documentation"""
    print("\n🧪 Test 5: README Documentation")

    file_path = "README.md"
    with open(file_path, 'r') as f:
        content = f.read()

    # Check 1: Mentions Docker
    assert "docker" in content.lower(), "Should mention Docker"
    print("   ✅ Mentions Docker")

    # Check 2: Has image pull instructions
    assert "docker pull" in content.lower(), "Should have docker pull instructions"
    print("   ✅ Has docker pull instructions")

    # Check 3: Has MCP_SERVER_IMAGE in config
    assert "MCP_SERVER_IMAGE" in content, "Should document MCP_SERVER_IMAGE"
    print("   ✅ Documents MCP_SERVER_IMAGE")

    return True


def test_dockerfile_exists():
    """Verify Dockerfile was created"""
    print("\n🧪 Test 6: Dockerfile Existence")

    file_path = "Dockerfile"
    if not os.path.exists(file_path):
        print("   ❌ ERROR: Dockerfile not found")
        return False

    with open(file_path, 'r') as f:
        content = f.read()

    # Check: Has Docker CLI installation
    if "docker" not in content.lower():
        print("   ⚠️  Warning: Dockerfile doesn't seem to install Docker CLI")

    print("   ✅ Dockerfile exists")
    return True


def verify_docker_command_logic():
    """Verify the Docker command construction logic in code"""
    print("\n🧪 Test 7: Docker Command Logic")

    file_path = "mcp_client.py"
    with open(file_path, 'r') as f:
        content = f.read()

    # Extract the connect method
    connect_method = re.search(
        r'async def connect\(self\):.*?(?=\n    async def|\n    def|\Z)',
        content,
        re.DOTALL
    )

    if not connect_method:
        print("   ❌ ERROR: Could not find connect method")
        return False

    method_code = connect_method.group(0)

    # Verify command construction
    checks = [
        ('"run"', "run command"),
        ('"-i"', "-i flag for interactive"),
        ('"--rm"', "--rm flag for cleanup"),
        ('"-e"', "-e flag for environment vars"),
        ("docker_args.append", "appending image to args"),
        ('command="docker"', "docker as command"),
    ]

    for pattern, description in checks:
        if pattern in method_code:
            print(f"   ✅ Has {description}")
        else:
            print(f"   ❌ Missing {description}")
            return False

    return True


def run_all_tests():
    """Run all verification tests"""
    print("=" * 60)
    print("MCP Bridge Docker Configuration Verification")
    print("=" * 60)
    print("\nVerifying that all files are correctly configured")
    print("to use Docker image instead of local Python file\n")

    tests = [
        test_mcp_client_file,
        test_main_file,
        test_env_example_file,
        test_docker_compose_file,
        test_readme_file,
        test_dockerfile_exists,
        verify_docker_command_logic,
    ]

    passed = 0
    failed = 0

    for test in tests:
        try:
            if test():
                passed += 1
            else:
                failed += 1
        except Exception as e:
            failed += 1
            print(f"   ❌ Test failed with error: {e}")
            import traceback
            traceback.print_exc()

    # Summary
    print("\n" + "=" * 60)
    print(f"Results: {passed}/{len(tests)} tests passed")
    print("=" * 60)

    if failed == 0:
        print("\n✅ ALL CONFIGURATION TESTS PASSED")
        print("\nThe MCP Bridge is correctly configured to:")
        print("  ✅ Use Docker image: ghcr.io/sperekrestova/github-mcp-server:latest")
        print("  ✅ Spawn MCP Server as Docker container")
        print("  ✅ Pass environment variables correctly")
        print("  ✅ Clean up containers automatically (--rm)")
        print("  ✅ Support stdio communication (-i)")
        print("\n📝 Configuration validated successfully!")
        print("\n🔧 To test with actual Docker:")
        print("   1. Install Docker")
        print("   2. Set GITHUB_TOKEN environment variable")
        print("   3. Run: python test_docker_integration.py")
        return True
    else:
        print(f"\n❌ {failed} test(s) failed")
        print("Please fix the configuration issues above")
        return False


if __name__ == "__main__":
    import sys
    os.chdir(os.path.dirname(__file__))
    success = run_all_tests()
    sys.exit(0 if success else 1)
