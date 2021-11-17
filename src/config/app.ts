import * as fs from 'fs';
const config = JSON.parse(fs.readFileSync("app_setup.json", "utf8"));

export default {
    host: config.app.host,
    port: config.app.port,
    domain: config.app.domain,
    backend_api_prefix: config.app.backend_api_prefix,
    access_token_ttl: config.app.access_token_ttl,
    refresh_token_ttl: config.app.refresh_token_ttl,
    token_secret: config.app.token_secret,
    aws_region: config.app.aws_region,
    aws_access_key_id: config.app.aws_access_key_id,
    aws_secret_access_key: config.app.aws_secret_access_key,
    aws_public_bucket_name: config.app.aws_public_bucket_name,

    smtp_mail: config.app.smtp_mail,
    smtp_host: config.app.smtp_host,
    smtp_port: config.app.smtp_port,
    smtp_tls: config.app.smtp_tls,
    smtp_secure: config.app.smtp_secure,
    smtp_user: config.app.smtp_user,
    smtp_pass: config.app.smtp_pass,

};
