import * as fs from 'fs';
const config = JSON.parse(fs.readFileSync("app_setup.json", "utf8"));

export default {
    database_address: config.database.database_address,
    database_port: config.database.database_port,
    database_name: config.database.database_name,
    database_login: config.database.database_login,
    database_password: config.database.database_password,
};