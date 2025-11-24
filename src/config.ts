const NEXT_PUBLIC_API_URL = process.env.NEXT_PUBLIC_API_URL;

if(!NEXT_PUBLIC_API_URL){
    throw new Error("Falta la variable apiUrl en el entorno (.env)");
}

const config = {
    NEXT_PUBLIC_API_URL,
};

export default config;