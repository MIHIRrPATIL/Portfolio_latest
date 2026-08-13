from typing import Dict, Any, List

class RepositoryGrader:
    """
    Automated Repository Evaluation Engine.
    Grades repositories from 0-100 and assigns a letter grade (A+, A, B+, B, C)
    based on code hygiene, testing presence, documentation, activity, and architecture.
    """

    @staticmethod
    def evaluate(repo_info: Dict[str, Any], tree_paths: List[str] = None) -> Dict[str, Any]:
        if tree_paths is None:
            tree_paths = []

        score = 0
        feedback: List[str] = []
        breakdown: Dict[str, int] = {
            "documentation": 0,
            "testing_and_ci": 0,
            "activity_and_hygiene": 0,
            "architecture": 0
        }

        # ─── 1. Documentation Score (Max 25 pts) ───
        has_readme = any("readme" in p.lower() for p in tree_paths) or repo_info.get("has_readme", False)
        has_license = repo_info.get("license") is not None or any("license" in p.lower() for p in tree_paths)
        has_contributing = any("contributing" in p.lower() for p in tree_paths)

        if has_readme:
            breakdown["documentation"] += 15
            feedback.append("✓ Comprehensive README found")
        else:
            feedback.append("✗ Missing README documentation")

        if has_license:
            breakdown["documentation"] += 7
            feedback.append("✓ Open-source license attached")
        else:
            feedback.append("⚠ Missing open-source license")

        if has_contributing:
            breakdown["documentation"] += 3
            feedback.append("✓ Contributing guidelines found")

        # ─── 2. Testing & CI/CD Score (Max 30 pts) ───
        has_tests = any(term in p.lower() for p in tree_paths for term in ["test", "tests", "spec", "__tests__"])
        has_ci = any(".github/workflows" in p.lower() or "circleci" in p.lower() or ".travis.yml" in p.lower() for p in tree_paths)
        has_docker = any("dockerfile" in p.lower() or "docker-compose" in p.lower() for p in tree_paths)

        if has_tests:
            breakdown["testing_and_ci"] += 15
            feedback.append("✓ Test suite detected")
        else:
            feedback.append("⚠ No automated test suite found")

        if has_ci:
            breakdown["testing_and_ci"] += 10
            feedback.append("✓ CI/CD workflow automation active")
        else:
            feedback.append("⚠ No CI/CD workflow defined")

        if has_docker:
            breakdown["testing_and_ci"] += 5
            feedback.append("✓ Containerization / Docker spec found")

        # ─── 3. Activity & Hygiene Score (Max 25 pts) ───
        stars = repo_info.get("stargazers_count", 0)
        forks = repo_info.get("forks_count", 0)
        open_issues = repo_info.get("open_issues_count", 0)
        has_topics = len(repo_info.get("topics", [])) > 0

        # Base stars & engagement
        if stars > 0:
            breakdown["activity_and_hygiene"] += min(10, stars * 2)
        else:
            breakdown["activity_and_hygiene"] += 5

        if has_topics:
            breakdown["activity_and_hygiene"] += 5
            feedback.append("✓ Repository topics and tags defined")

        if open_issues < 10:
            breakdown["activity_and_hygiene"] += 10
            feedback.append("✓ Clean issue tracker hygiene")

        # ─── 4. Architecture & Package Score (Max 20 pts) ───
        has_manifest = any(m in p.lower() for p in tree_paths for m in ["package.json", "requirements.txt", "cargo.toml", "go.mod", "pyproject.toml", "build.gradle"])
        language = repo_info.get("language")

        if has_manifest:
            breakdown["architecture"] += 12
            feedback.append(f"✓ Package dependency manifest found ({language or 'Multi-language'})")
        else:
            breakdown["architecture"] += 5

        if len(tree_paths) > 10:
            breakdown["architecture"] += 8
            feedback.append("✓ Multi-file modular project structure")

        # Compute total score
        total_score = sum(breakdown.values())
        total_score = min(100, max(0, total_score))

        # Determine Letter Grade
        if total_score >= 90:
            grade = "A+"
        elif total_score >= 80:
            grade = "A"
        elif total_score >= 70:
            grade = "B+"
        elif total_score >= 60:
            grade = "B"
        else:
            grade = "C"

        return {
            "repo_name": repo_info.get("name", "Unknown"),
            "score": total_score,
            "grade": grade,
            "breakdown": breakdown,
            "feedback": feedback,
            "language": language,
            "stars": stars,
            "forks": forks,
            "html_url": repo_info.get("html_url", "")
        }
