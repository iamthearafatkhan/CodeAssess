"""
Multi-provider code execution with automatic fallback.

Usage:
    from apps.submissions.services.executor import run_code
    result = run_code("print(1)", "python", "")

Order of providers:
  1. Judge0 (public CE)
  2. onlinecompiler.io

If Judge0 returns an error (rate limit, timeout, API down), the next
provider is tried. The result dict always has the same shape.
"""

from .judge0 import run_code as run_via_judge0
from .onlinecompiler import run_via_onlinecompiler


def run_code(source_code, language, stdin=""):
    """
    Try each provider in order. Return the first successful result.
    If all fail, return a dict with 'error' set.
    """
    providers = [
        ("judge0", run_via_judge0),
        ("onlinecompiler", run_via_onlinecompiler),
    ]

    errors = []
    for name, provider in providers:
        try:
            result = provider(source_code, language, stdin)
            # Success = no transport error AND a real status from the runner
            if not result.get("error") and result.get("status"):
                result["provider"] = name
                return result
            errors.append(f"{name}: {result.get('error') or 'no status'}")
        except Exception as e:
            errors.append(f"{name}: {e}")

    return {
        "stdout": "",
        "stderr": "",
        "compile_output": "",
        "status": "",
        "time": None,
        "memory": None,
        "provider": None,
        "error": "All providers failed. " + " | ".join(errors),
    }