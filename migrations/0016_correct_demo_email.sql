-- Correct the existing demo identity without changing its password or scope.
UPDATE users SET email = 'demo@kamehame-japan.com'
WHERE id = 'u-partner-public-demo' AND email = 'demo@kamemane-japan.com';
