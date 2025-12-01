export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  lastName: string;
}

export interface UpdateUserDto {
  password: string;
  name: string;
  lastName: string;
  active?: boolean;
}