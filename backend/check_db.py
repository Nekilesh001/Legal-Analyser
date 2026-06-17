import psycopg2
try:
    conn = psycopg2.connect(
        dbname='lexclarity_db',
        user='postgres',
        password='neki132506',
        host='localhost',
        port=5432
    )
    print("Connected to PostgreSQL!")
    cur = conn.cursor()
    cur.execute("SELECT table_name FROM information_schema.tables WHERE table_schema='public'")
    tables = [r[0] for r in cur.fetchall()]
    print("Tables:", tables)
    conn.close()
except Exception as e:
    print(f"Error: {e}")
    # Try creating the database
    try:
        conn2 = psycopg2.connect(
            dbname='postgres',
            user='postgres',
            password='neki132506',
            host='localhost',
            port=5432
        )
        conn2.autocommit = True
        cur2 = conn2.cursor()
        cur2.execute("SELECT 1 FROM pg_database WHERE datname='lexclarity_db'")
        exists = cur2.fetchone()
        if not exists:
            cur2.execute("CREATE DATABASE lexclarity_db")
            print("Created lexclarity_db database!")
        else:
            print("Database lexclarity_db already exists")
        conn2.close()
    except Exception as e2:
        print(f"Create DB error: {e2}")
