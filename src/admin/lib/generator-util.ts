import * as crypto from 'crypto';
import * as bcrypt from 'bcryptjs';

export class GeneratorUtil {
    static generateToken(id: string | bigint, secret: string) {
        const string = JSON.stringify({
            userID: id,
            dt: new Date(),
            type: 'access',
        });
        const md5 = crypto.createHmac('md5', secret);
        return md5.update(string).digest('hex');
    }

    static generateRandomCode(length) {
        return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
    }

    static async generateHash(password: string): Promise<string> {
        const salt = await bcrypt.genSalt(10);
        return bcrypt.hash(password, salt);
    }
}
