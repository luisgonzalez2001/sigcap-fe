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
  rol?: "admin" | "socio";
  verified?: boolean;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserWithRole extends User {
  rol: "admin" | "socio";
  verified: boolean;
  active: boolean;
  created_at: string;
  updated_at: string;
}