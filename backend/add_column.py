import sqlite3
import os

def add_column():
    db_file = 'saas_db_v3.sqlite'
    if not os.path.exists(db_file):
        print(f"Database {db_file} not found.")
        return
        
    conn = sqlite3.connect(db_file)
    cursor = conn.cursor()
    try:
        cursor.execute("ALTER TABLE users ADD COLUMN blocked_until DATETIME;")
        conn.commit()
        print(f"Column 'blocked_until' added successfully to {db_file}.")
    except Exception as e:
        print(f"Error: {e}")
    finally:
        conn.close()

if __name__ == "__main__":
    add_column()
