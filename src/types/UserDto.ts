export interface CreateUserDto {
  email: string;
  password: string;
  name: string;
  lastName: string;
  phoneNumber: string;
}

export interface UpdateUserDto {
  password?: string;
  name?: string;
  lastName?: string;
  phoneNumber?: string;
  active?: boolean;
}

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  phoneNumber: string;
}