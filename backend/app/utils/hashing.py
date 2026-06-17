import hashlib

def get_file_hash(content: bytes) -> str:
    return hashlib.sha256(content).hexdigest()
