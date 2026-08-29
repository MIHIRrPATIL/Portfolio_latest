from typing import Dict, Any, List

class RepositoryGrader:
    """
    Robust Repository Evaluation Engine.
    Evaluates repositories out of 100 points based on architecture complexity,
    stack synergy, documentation, engineering rigor, entrypoint hygiene, and activity.
    Does NOT unfairly penalize projects for lacking dedicated unit test suites if they
    exhibit rich modular architecture, containerization, or clean entrypoints.
    """

    @staticmethod
    def evaluate(repo_info: Dict[str, Any], tree_paths: List[str] = None) -> Dict[str, Any]:
        if tree_paths is None:
            tree_paths = []

        lower_paths = [p.lower() for p in tree_paths]

        score = 0
        feedback: List[str] = []
        breakdown: Dict[str, int] = {
            "architecture_and_complexity": 0,
            "documentation_and_dx": 0,
            "engineering_rigor": 0,
            "activity_and_hygiene": 0
        }

        # ─── 1. Architecture, Code Complexity & Stack Synergy (Max 35 pts) ───
        file_count = len(tree_paths)
        has_manifest = any(
            m in p for p in lower_paths for m in [
                "package.json", "requirements.txt", "cargo.toml", 
                "go.mod", "pyproject.toml", "build.gradle", "pom.xml"
            ]
        )
        
        # Modular Codebase Depth
        if file_count >= 20:
            breakdown["architecture_and_complexity"] += 15
            feedback.append(f"✓ Rich modular codebase ({file_count}+ files)")
        elif file_count >= 8:
            breakdown["architecture_and_complexity"] += 10
            feedback.append(f"✓ Structured project repository ({file_count} files)")
        else:
            breakdown["architecture_and_complexity"] += 5

        # Dependency & Package Hygiene
        if has_manifest:
            breakdown["architecture_and_complexity"] += 10
            language = repo_info.get("language") or "Multi-Language"
            feedback.append(f"✓ Explicit dependency manifest found ({language})")
        else:
            breakdown["architecture_and_complexity"] += 4

        # Multi-Tier / Full-Stack Synergy Detection (e.g. client/server, api/ui, Docker, env)
        has_multi_tier = any(
            dir_name in p for p in lower_paths for dir_name in ["client/", "server/", "api/", "components/", "backend/", "frontend/", "services/"]
        )
        if has_multi_tier:
            breakdown["architecture_and_complexity"] += 10
            feedback.append("✓ Multi-tier full-stack directory separation")

        # ─── 2. Documentation & Developer Experience (Max 30 pts) ───
        has_readme = any("readme" in p for p in lower_paths) or repo_info.get("has_readme", False)
        has_license = repo_info.get("license") is not None or any("license" in p for p in lower_paths)
        has_topics = len(repo_info.get("topics", [])) > 0
        has_description = bool(repo_info.get("description"))

        if has_readme:
            breakdown["documentation_and_dx"] += 18
            feedback.append("✓ Comprehensive README documentation found")
        else:
            feedback.append("⚠ Missing README documentation")

        if has_license:
            breakdown["documentation_and_dx"] += 6
            feedback.append("✓ Open-source license attached")

        if has_topics or has_description:
            breakdown["documentation_and_dx"] += 6
            feedback.append("✓ Repository metadata, description, & topics configured")

        # ─── 3. Engineering Rigor & Production Quality (Max 20 pts) ───
        has_docker = any("dockerfile" in p or "docker-compose" in p for p in lower_paths)
        has_ci = any(".github/workflows" in p or "circleci" in p or ".travis.yml" in p for p in lower_paths)
        has_tests = any(term in p for p in lower_paths for term in ["test", "tests", "spec", "__tests__", "pytest"])
        has_clean_entrypoint = any(entry in p for p in lower_paths for entry in ["main.py", "app.py", "index.ts", "index.js", "run.py", "server.js"])

        if has_docker:
            breakdown["engineering_rigor"] += 7
            feedback.append("✓ Containerization spec (Dockerfile / Compose) configured")
        
        if has_ci:
            breakdown["engineering_rigor"] += 7
            feedback.append("✓ Automated CI/CD workflow pipeline active")

        if has_tests:
            breakdown["engineering_rigor"] += 6
            feedback.append("✓ Automated test suite detected")
        elif has_clean_entrypoint:
            breakdown["engineering_rigor"] += 5
            feedback.append("✓ Clean application entrypoint & executable runtime spec")
        else:
            breakdown["engineering_rigor"] += 2

        # ─── 4. Community, Activity & Issue Hygiene (Max 15 pts) ───
        stars = repo_info.get("stargazers_count", 0)
        forks = repo_info.get("forks_count", 0)
        open_issues = repo_info.get("open_issues_count", 0)

        # Engagement points
        engagement_pts = min(10, (stars * 2) + (forks * 3))
        breakdown["activity_and_hygiene"] += max(5, engagement_pts)

        if open_issues < 10:
            breakdown["activity_and_hygiene"] += 5
            feedback.append("✓ Clean issue tracker hygiene")

        # Compute total score
        total_score = sum(breakdown.values())
        total_score = min(100, max(0, total_score))

        # Determine Grade
        if total_score >= 85:
            grade = "A+"
        elif total_score >= 75:
            grade = "A"
        elif total_score >= 65:
            grade = "B+"
        elif total_score >= 50:
            grade = "B"
        else:
            grade = "C"

        return {
            "repo_name": repo_info.get("name", "Unknown"),
            "score": total_score,
            "grade": grade,
            "breakdown": breakdown,
            "feedback": feedback,
            "language": repo_info.get("language"),
            "stars": stars,
            "forks": forks,
            "html_url": repo_info.get("html_url")
        }
