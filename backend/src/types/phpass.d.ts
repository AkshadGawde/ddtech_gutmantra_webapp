declare module "phpass" {
  export default class PasswordHash {
    constructor(iteration_count_log2: number, portable_hashes: boolean);
    CheckPassword(password: string, hash: string): boolean;
  }
}