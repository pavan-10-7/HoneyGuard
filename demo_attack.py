import random
import time
from datetime import datetime

import requests


BASE_URL = "http://127.0.0.1:8000"

# Longer interval so the dashboard can visibly update between events.
MIN_DELAY = 4
MAX_DELAY = 6

ATTACKS = [
    {
        "name": "Administrative Login Probe",
        "method": "GET",
        "path": "/admin/login",
    },
    {
        "name": "WordPress Enumeration",
        "method": "GET",
        "path": "/wp-admin",
    },
    {
        "name": "Jenkins Console Enumeration",
        "method": "GET",
        "path": "/jenkins",
    },
    {
        "name": "Grafana Dashboard Probe",
        "method": "GET",
        "path": "/grafana",
    },
    {
        "name": "Environment File Discovery",
        "method": "GET",
        "path": "/.env",
    },
    {
        "name": "Backup Discovery",
        "method": "GET",
        "path": "/backup.zip",
    },
    {
        "name": "Database Administration Probe",
        "method": "GET",
        "path": "/phpmyadmin",
    },
    {
        "name": "Internal API Probe",
        "method": "GET",
        "path": "/api/internal",
    },
]


# Different attack profiles intentionally produce different
# amounts of telemetry during the demonstration.
ATTACK_PROFILES = {
    "LIGHT": {
        "count": 2,
        "description": "Low-intensity reconnaissance",
    },
    "MODERATE": {
        "count": 4,
        "description": "Moderate reconnaissance",
    },
    "HIGH": {
        "count": 6,
        "description": "High-intensity reconnaissance",
    },
    "FULL": {
        "count": 8,
        "description": "Full attack sequence",
    },
}


def banner():
    print()
    print("=" * 64)
    print("                 HONEYGUARD DEMO ATTACK")
    print("=" * 64)
    print()
    print(f"Target : {BASE_URL}")
    print(f"Started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"Delay  : {MIN_DELAY}-{MAX_DELAY}s")
    print()
    print("=" * 64)
    print()


def check_backend():
    try:
        response = requests.get(
            f"{BASE_URL}/api/v1/events",
            timeout=5,
        )

        if response.ok:
            print("[✓] HoneyGuard backend is reachable.")
            return True

        print(
            f"[✗] Backend returned HTTP {response.status_code}."
        )
        return False

    except requests.RequestException as exc:
        print(f"[✗] Could not reach HoneyGuard backend: {exc}")
        return False


def start_new_demo_session():
    print()
    print("[*] Starting fresh demo session...")

    try:
        response = requests.post(
            f"{BASE_URL}/api/v1/sessions/demo/new",
            timeout=5,
        )

        if not response.ok:
            print(
                f"[✗] Could not start fresh session "
                f"(HTTP {response.status_code})."
            )
            return False

        print("[✓] Fresh demo session ready.")
        return True

    except requests.RequestException as exc:
        print(f"[✗] Failed to start fresh session: {exc}")
        return False


def choose_attack_profile():
    # Bias toward LIGHT/MODERATE/HIGH so most demonstrations
    # do not immediately reach the maximum score.
    profile_name = random.choices(
        population=["LIGHT", "MODERATE", "HIGH", "FULL"],
        weights=[30, 40, 20, 10],
        k=1,
    )[0]

    profile = ATTACK_PROFILES[profile_name]

    print()
    print(
        f"[*] Attack profile: {profile_name} "
        f"— {profile['description']}"
    )
    print(f"[*] Planned requests: {profile['count']}")
    print()

    return profile_name, profile["count"]


def choose_attacks(count):
    # Select a unique subset so the same run doesn't simply repeat
    # the exact same sequence.
    selected = random.sample(ATTACKS, count)

    # Shuffle again for clarity and unpredictability.
    random.shuffle(selected)

    return selected


def perform_attack(index, total, attack):
    name = attack["name"]
    method = attack["method"]
    path = attack["path"]

    print(f"[{index}/{total}] {name}")
    print(f"      {method} {path}")

    try:
        response = requests.request(
            method,
            f"{BASE_URL}{path}",
            timeout=5,
        )

        print(f"      → HTTP {response.status_code}")

        return True

    except requests.RequestException as exc:
        print(f"      → Request failed: {exc}")
        return False


def main():
    banner()

    if not check_backend():
        print()
        print("Demo aborted.")
        return

    if not start_new_demo_session():
        print()
        print("Demo aborted.")
        return

    profile_name, attack_count = choose_attack_profile()

    attacks = choose_attacks(attack_count)

    print("Beginning attack sequence...")
    print()

    for index, attack in enumerate(attacks, start=1):
        perform_attack(
            index,
            attack_count,
            attack,
        )

        # Don't wait after the final request.
        if index < attack_count:
            delay = random.uniform(
                MIN_DELAY,
                MAX_DELAY,
            )

            print(
                f"      [waiting {delay:.1f}s for live telemetry]"
            )
            print()

            time.sleep(delay)

    print()
    print("=" * 64)
    print("              DEMO ATTACK COMPLETE")
    print("=" * 64)
    print()
    print(f"Profile: {profile_name}")
    print()
    print("Check the HoneyGuard dashboard for:")
    print("  • New attack session")
    print("  • Live event timeline")
    print("  • Threat score progression")
    print("  • Severity progression")
    print("  • Threat distribution")
    print()


if __name__ == "__main__":
    main()