def _quote(value: str, var_type: str) -> str:
    if var_type in ("number", "bool"):
        return value
    if var_type.startswith("list") or var_type.startswith("map"):
        return value
    return f'"{value}"'


def generate_variables_tf(variables: list[dict]) -> str:
    if not variables:
        return ""

    blocks = []
    for var in variables:
        name = var.get("name", "")
        var_type = var.get("type", "string")
        description = var.get("description", "")
        default_value = var.get("default_value")
        validation_condition = var.get("validation_condition")
        validation_message = var.get("validation_message", "Invalid value.")
        is_sensitive = var.get("is_sensitive", False)

        lines = [f'variable "{name}" {{']
        if description:
            lines.append(f'  description = "{description}"')
        lines.append(f"  type        = {var_type}")
        if is_sensitive:
            lines.append("  sensitive   = true")
        if default_value is not None:
            lines.append(f"  default     = {_quote(default_value, var_type)}")
        if validation_condition:
            lines.append("")
            lines.append("  validation {")
            lines.append(f'    condition     = {validation_condition}')
            lines.append(f'    error_message = "{validation_message}"')
            lines.append("  }")
        lines.append("}")
        blocks.append("\n".join(lines))

    return "\n\n".join(blocks)
