"""
Thin wrapper around the public Judge0 CE API.

Usage:
    result = run_code(source_code="print(1)", language="python", stdin="")
    result["stdout"]   # "1\n"
    result["status"]   # "Accepted"
    result["error"]    # None, or an error string if something went wrong
"""

import requests

JUDGE0_URL = "https://ce.judge0.com"

LANGUAGE_IDS = {
    "python": 71,   # Python 3.8.1
    "c": 50,        # C (GCC 9.2.0)
    "cpp": 54,      # C++ (GCC 9.2.0)
    "java": 62,     # Java (OpenJDK 13.0.1)
}

# Judge0 status IDs → human readable
STATUS_LABELS = {
    1: "In Queue",
    2: "Processing",
    3: "Accepted",
    4: "Wrong Answer",
    5: "Time Limit Exceeded",
    6: "Compilation Error",
    7: "Runtime Error (SIGSEGV)",
    8: "Runtime Error (SIGXFSZ)",
    9: "Runtime Error (SIGFPE)",
    10: "Runtime Error (SIGABRT)",
    11: "Runtime Error (NZEC)",
    12: "Runtime Error (Other)",
    13: "Internal Error",
    14: "Exec Format Error",
}


def run_code(source_code, language, stdin="", timeout=30):
    """
    Run source_code via Judge0. Returns a dict:

        {
            "stdout": str,
            "stderr": str,
            "compile_output": str,
            "status": str,       # e.g. "Accepted", "Wrong Answer"
            "time": str | None,  # "0.02" seconds
            "memory": int | None,
            "error": str | None, # populated only if the API call itself failed
        }

    This function never raises. If Judge0 is down, "error" is set.
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

    language_id = LANGUAGE_IDS.get(language)
    if not language_id:
        empty["error"] = f"Unsupported language: {language}"
        return empty

    payload = {
        "source_code": source_code,
        "language_id": language_id,
        "stdin": stdin,
    }

    try:
        response = requests.post(
            f"{JUDGE0_URL}/submissions?wait=true&base64_encoded=false",
            json=payload,
            timeout=timeout,
        )
        response.raise_for_status()
        data = response.json()
    except requests.exceptions.RequestException as e:
        empty["error"] = f"Judge0 request failed: {e}"
        return empty
    except ValueError:
        empty["error"] = "Judge0 returned invalid JSON"
        return empty

    status_id = (data.get("status") or {}).get("id")
    status_label = STATUS_LABELS.get(status_id, (data.get("status") or {}).get("description", ""))

    return {
        "stdout": (data.get("stdout") or "").strip(),
        "stderr": (data.get("stderr") or "").strip(),
        "compile_output": (data.get("compile_output") or "").strip(),
        "status": status_label,
        "time": data.get("time"),
        "memory": data.get("memory"),
        "error": None,
    }