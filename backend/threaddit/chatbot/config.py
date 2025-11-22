"""
Configuration for chatbot content safety and filtering.
"""

# Political keywords that trigger advisory banner
POLITICAL_KEYWORDS = [
    "election", "vote", "voting", "ballot", "candidate", "president", "senator",
    "congress", "democrat", "republican", "party", "campaign", "poll", "polls",
    "political", "politics", "policy", "legislation", "bill", "law", "amendment",
    "primary", "caucus", "delegate", "electoral", "college", "referendum",
    "proposition", "initiative", "ballot measure", "governor", "mayor"
]

# PII and doxxing patterns to block
PII_PATTERNS = [
    r"\b\d{3}-\d{2}-\d{4}\b",  # SSN pattern
    r"\b\d{3}\.\d{2}\.\d{4}\b",  # SSN with dots
    r"\b\d{9}\b",  # 9 digit number (potential SSN)
    r"\b\d{4}\s?\d{4}\s?\d{4}\s?\d{4}\b",  # Credit card pattern
    r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b.*(?:password|pass|pwd|secret)",  # Email with password
    r"\b(?:dob|date of birth|birth date|born on)\s*:?\s*\d{1,2}[/-]\d{1,2}[/-]\d{2,4}",  # DOB
    r"\b(?:ssn|social security|tax id|tin)\s*:?\s*\d",  # SSN keywords
    r"\b(?:private|confidential|secret|classified)\s+(?:key|token|api|password)",  # Private info keywords
]

# Illegal instruction patterns
ILLEGAL_PATTERNS = [
    r"\b(?:how to|how do I|tell me how|instructions to)\s+(?:hack|break|steal|illegal|unlawful)",
    r"\b(?:create|make|generate)\s+(?:virus|malware|bomb|weapon|drug)",
    r"\b(?:kill|murder|assassinate|harm|hurt)\s+",
]

# Source redaction keywords (sources containing these will be redacted)
SOURCE_REDACTION_KEYWORDS = [
    "ssn", "social security", "private", "confidential", "secret", "dob", 
    "date of birth", "password", "credit card", "bank account", "routing number"
]

# Rate limiting configuration
RATE_LIMIT_PER_MINUTE_IP = 10  # Requests per minute per IP
RATE_LIMIT_PER_MINUTE_USER = 20  # Requests per minute per authenticated user

# RAG service configuration
RAG_SERVICE_URL = "http://127.0.0.1:8000/rag"
RAG_SERVICE_TIMEOUT = 30  # seconds

