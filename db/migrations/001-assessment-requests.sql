CREATE TABLE assessment_requests (
 id TEXT PRIMARY KEY NOT NULL,
 name TEXT NOT NULL CHECK(length(name) BETWEEN 1 AND 100),
 company TEXT NOT NULL CHECK(length(company) BETWEEN 1 AND 150),
 email TEXT NOT NULL CHECK(length(email) BETWEEN 1 AND 200),
 service TEXT NOT NULL CHECK(service IN ('complete','web_api','infrastructure_cloud','code_architecture','remediation_retest')),
 scope TEXT NOT NULL CHECK(length(scope) BETWEEN 10 AND 3000),
 status TEXT NOT NULL DEFAULT 'new' CHECK(status IN ('new','reviewing','closed')),
 created_at TEXT NOT NULL,
 updated_at TEXT NOT NULL
);
PRAGMA user_version = 1;
