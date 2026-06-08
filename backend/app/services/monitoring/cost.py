MONTHLY_USD = {
    "ec2": {
        "t2.micro": 8.47,
        "t2.small": 16.94,
        "t2.medium": 33.89,
        "t3.micro": 8.47,
        "t3.small": 16.94,
        "t3.medium": 33.89,
        "t3.large": 67.78,
        "t3.xlarge": 135.57,
        "m5.large": 87.60,
        "m5.xlarge": 175.20,
        "c5.large": 78.84,
        "r5.large": 121.68,
    },
    "s3": 0.30,
    "vpc": 0.0,
    "rds": 25.00,
    "elb": 18.25,
    "eks": 73.00,
    "lambda": 0.20,
    "azure": 15.00,
    "gcp": 15.00,
}


def _resource_cost(resource_type: str, config: dict) -> float:
    if resource_type == "ec2":
        instance_type = config.get("instance_type", "t3.micro")
        return MONTHLY_USD["ec2"].get(instance_type, MONTHLY_USD["ec2"]["t3.micro"])
    return MONTHLY_USD.get(resource_type, 0.0)


def estimate(resources: list[dict]) -> dict:
    breakdown = []
    total = 0.0
    for r in resources:
        cost = _resource_cost(r.get("type", ""), r.get("config", {}))
        breakdown.append({
            "name": r.get("name", ""),
            "type": r.get("type", ""),
            "monthly_usd": round(cost, 2),
        })
        total += cost
    total = round(total, 2)
    return {
        "monthly_usd": total,
        "annual_usd": round(total * 12, 2),
        "breakdown": breakdown,
        "disclaimer": "Estimates only. Actual AWS costs depend on usage, data transfer, and region.",
    }
