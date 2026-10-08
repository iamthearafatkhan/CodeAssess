"""
onlinecompiler.io API wrapper.

Docs: https://api.onlinecompiler.io/
Endpoint: POST https://api.onlinecompiler.io/api/run-code-sync/
Auth: header  Authorization: <API_KEY>   (raw key, no "Bearer")
Body: {"compiler": "...", "code": "...", "input": "..."}

Response (success):
    {
        "output": "Hello, World!\n",
        "error": "",
        "status": "success",
        "exit_code": 0,
        "signal": null,
        "time": "0.0248",
        "total": "0.0330",
        "memory": "8192"
    }

Limits:
    - 512 MB memory, 30s timeout
    - 100 KB code, 100 KB input
    - Output truncated at 999 characters
    - Sync endpoint: max 4 concurrent requests (429 when at capacity)
"""

import requests
from decouple import config

API_KEY = config("ONLINECOMPILER_API_KEY", default="")
BASE_URL = "https://api.onlinecompiler.io/api"

# Map our internal language keys → onlinecompiler's compiler IDs
COMPILER_MAP = {
    "python": "python-3.14",
    "c": "gcc-15",
    "cpp": "g++-15",
    "java": "openjdk-25",
}


def run_via_onlinecompiler(source_code, language, stdin="", timeout=30):
    """
    Same interface as judge0.run_code(). Returns a dict:

        {
            "stdout": str,
            "stderr": str,
            "compile_output": str,
            "status": str,
            "time": str | None,
            "memory": int | None,
            "error": str | None,
        }
    """
    empty = {
        "stdout": "",
        "stderr": "",
        "compile_output": "",
        "status": "",
        "time": None,
        "memory": None,
        "error": None,
    }

    if not API_KEY:
        empty["error"] = "ONLINECOMPILER_API_KEY not configured"
        return empty

    compiler = COMPILER_MAP.get(language)
    if not compiler:
        empty["error"] = f"Unsupported language: {language}"
        return empty

    try:
        response = requests.post(
            f"{BASE_URL}/run-code-sync/",
            headers={
                "Authorization": API_KEY,          # ← raw key, no Bearer
                "Content-Type": "application/json",
            },
            json={
                "compiler": compiler,               # ← field name
                "code": source_code,
                "input": stdin,
            },
            timeout=timeout,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.HTTPError as e:
        detail = ""
        try:
            detail = response.json().get("error", "")
        except Exception:
            detail = response.text[:200] if response.text else ""
        empty["error"] = f"onlinecompiler HTTP {response.status_code}: {detail or e}"
        return empty
    except requests.exceptions.RequestException as e:
        empty["error"] = f"onlinecompiler request failed: {e}"
        return empty
    except ValueError:
        empty["error"] = "onlinecompiler returned invalid JSON"
        return empty

    raw_output = (data.get("output") or "").strip()
    error_text = (data.get("error") or "").strip()
    status_str = (data.get("status") or "").lower()
    exit_code = data.get("exit_code")
    signal_num = data.get("signal")

    # Determine whether execution succeeded
    is_success = status_str == "success" and exit_code == 0 and not error_text

    # Translate the exit_code/signal into a Judge0-style status label
    if is_success:
        judge_status = "Accepted"
    elif exit_code == 124:
        judge_status = "Time Limit Exceeded"
    elif signal_num == 9 or exit_code == 137:
        judge_status = "Time Limit Exceeded"
    elif signal_num == 11 or exit_code == 139:
        judge_status = "Runtime Error (SIGSEGV)"
    elif exit_code and exit_code != 0:
        judge_status = "Runtime Error (Other)"
    else:
        judge_status = "Runtime Error (Other)"

    # memory comes back as a string like "8192"
    try:
        memory_kb = int(data.get("memory")) if data.get("memory") is not None else None
    except (TypeError, ValueError):
        memory_kb = None

    return {
        "stdout": raw_output if is_success else "",
        "stderr": error_text,
        "compile_output": "",
        "status": judge_status,
        "time": str(data.get("time")) if data.get("time") is not None else None,
        "memory": memory_kb,
        "error": None,
    }