import os

def print_all_file_paths(root_dir):
    for current_root, dirs, files in os.walk(root_dir):
        dirs[:] = [d for d in dirs if d not in ["venv", ".git", "node_modules", "backups"]]

        for file in files:
            full_path = os.path.join(current_root, file)
            print(full_path)

# Example usage
root_path = r"C:\Users\PC Paradise\Desktop\Work\Projects\Blockchain-Based Assignment Management System"
print_all_file_paths(root_path)

