"use server";

import { cookies } from "next/headers";

export async function cookieExist(name: string): Promise<boolean> {
    const cookieStore = await cookies();
    return cookieStore.has(name);
}

export async function cookieGet(name: string) {
    const cookieStore = await cookies();
    return cookieStore.get(name);
}

export async function cookieSet(name: string, value: string) {
    const cookieStore = await cookies();
    cookieStore.set(name, value);
}
