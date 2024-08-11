import pymysql
import os

# Establish database connection
connection = pymysql.connect(
    host='192.168.4.3',
    port=5544,
    user='silasfelinus',
    password='Acrolin2218',
    db='kindrobots'
)

try:
    with connection.cursor() as cursor:
        # Get the list of tables with a 'created_at' column
        cursor.execute("""
            SELECT TABLE_NAME 
            FROM INFORMATION_SCHEMA.COLUMNS 
            WHERE COLUMN_NAME = 'started_at' 
            AND TABLE_SCHEMA = 'kindrobots';
        """)
        tables = cursor.fetchall()

        # Loop through each table and check for invalid datetime values
        for table in tables:
            print(f"Checking table: {table[0]}")
            cursor.execute(f"""
                SELECT COUNT(*) 
                FROM `{table[0]}` 
                WHERE MONTH(started_at) = 0 OR DAY(started_at) = 0;
            """)
            count = cursor.fetchone()
            print(f"Invalid datetime entries in {table[0]}: {count[0]}")
finally:
    connection.close()
