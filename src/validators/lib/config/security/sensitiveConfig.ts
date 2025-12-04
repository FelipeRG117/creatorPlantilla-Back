export const SENSITIVE_KEYS =[
    "apiKey", 
    "apiSecret", 
    "accessToken", 
    "encryptionKey", 
    "databasePassword", 
    "jwtSecret"
] as const //porque se pone como const si es array ademas  dell sentido de hacer esot 


//extyraer el tipo para ts tipo derivado automaticamente 
export type SensitiveKeys = typeof SENSITIVE_KEYS[number];//porque s eutiliza la opiedad dentrola "constante" como si quisieras acceder a una clave 

//crear set para busquesas 0(1)
//set con tipado correcto
export const SENSITIVE_KEY_SET = new Set<string>(SENSITIVE_KEYS)//cual es el senbitido de hacer esto uy porque ? 


///tenghpo que aplciar la implementacion vesion con set e implementar bien las funciones siguientes 
