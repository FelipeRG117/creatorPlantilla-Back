import { Redactable, Redacted, RedactedValue, SensitiveKeys } from "@/lib/config/types/env"
import { SENSITIVE_KEY_SET, SENSITIVE_KEYS } from "./sensitiveConfig";
 
export const redactSecrets = <T extends object>(
    obj: T, 
    maxDepth = 5, 
    currentDepth = 5, 
    visited = new WeakSet<object>()
): Redacted<T> => {

//caso base profndidad maxima 
if(currentDepth > maxDepth){
return {
    ...Object.keys(obj).reduce((acc, key)=>({
        ...acc, 
        [key]: "[MAX_DEPTH]"
    }), {})
} as Redacted<T>;
}

if(visited.has(obj)){
return{
    ...Object.keys(obj).reduce((acc, key)=> ({
        ...acc, 
        [key]: "[CIRCULAR]"
    }), {})
}  as Redacted<T>;
}

visited.add(obj)


return Object.entries(obj).reduce((acc, [key, value]) => {
    //validcion real en runtime 

///Redaccion segura por  tipo de valor
//let newValue = value;
let newValue: RedactedValue<typeof value>;

if(isObject(value)){
newValue = redactSecrets(
    value, 
    maxDepth, 
    currentDepth + 1, 
    visited
)
}else if (key === "passsword"  || key === "token" || key === "apiKey"){
    newValue = "***"; 
}else{
    newValue = value 
}
    return {
        ...acc, 
        [key]: newValue
  
    };
}, {} as Redacted<T>)
}


//helpers para objeto 
const isObject= (value: unknown):value is object=> typeof value === "object" && value !==  null && !Array.isArray(value);

//verificar clave key de secrets 
const isSensitiveKey =(key: string): key is SensitiveKeys=>{
return SENSITIVE_KEY_SET.has(key)
}

///helper para valores 
const redactValue = (value: unknown): string=> {
if(value === null) return `***[null]`
if(value === undefined) return `***[undefined]`
if(typeof value !== "string") return `***[non-string]`
if(value === ``) return `***[empty]`

return `***${value.slice(-4)}`
}



/* return Object.fromEntries(
        //por que se utilizan signo de array en parametros de map cuando aplciar esto que proposito y que ventajas  y edesventajas tiene esto cuando utilzairlo  y cuando no?
        Object.entries(obj).map(([key, value])=>{
            if(["apiKey", "apiSecret", "accessToken"].includes(key) && typeof value === "string"){
                const isSensitive =(key as string) in Sensitie
                return [key, `***${value.slice(-4)}`]
            }
            return [key, value]
        })
    ) as Redacted<T>//es buena practica tipaslo como un tipo deifnido en este caso y lo tome por defecto de que devolvera esto que es un redacted con este tipo genereico que en si no entiendo la razon de ser asi mas que  queja es duda que quisiera comprender  */

















    /* import { Redactable, Redacted, RedactedValue, SensitiveKeys } from "@/lib/config/types/env"
import { SENSITIVE_KEY_SET, SENSITIVE_KEYS } from "./sensitiveConfig";




//Helper para valores individuales 
//a que se refiere con valroes individuales y a quue se refeire esto y como ayuda ?
/* const redactValue = (value: unknown): string =>{
if(typeof value !== "string")return "***[non-string]";
return value ? `***${value.slice(-4)}` : "***[empty]";//que hace esta linea y como afecta ademas del proposito de value.slice(-4)
}

 */
/* export const redactSecrets = <T extends object>(
    obj: T, 
    maxDepth = 5, 
    currentDepth = 5, 
    visited = new WeakSet<object>()//que es weakSet 
): Redacted<T> => {

//caso base profndidad maxima 
if(currentDepth > maxDepth){
return {
    ...Object.keys(obj).reduce((acc, key)=>({
        ...acc, 
        [key]: "[MAX_DEPTH]"
    }), {})
} as Redacted<T>;
}

if(visited.has(obj)){
return{
    ...Object.keys(obj).reduce((acc, key)=> ({
        ...acc, 
        [key]: "[CIRCULAR]"
    }), {})
}  as Redacted<T>;
}

visited.add(obj)




return Object.entries(obj).reduce((acc, [key, value]) => { */
    //validcion real en runtime 
   // const isSensitive = SENSITIVE_KEYS.some((k): k is SensitiveKeys => k ===key  )//que ahce esta  liena cada parte porque se hace de esta forma ademas de que caul de loas 2 formas de isSensditive es las adeacuada   porque ?
    //const isSensitive = SENSITIVE_KEY_SET.has(key) && SENSITIVE_KEYS.includes(key as SensitiveKeys)//porque se valida la key de esta forma y el porque se hace de esta forma ademas de cuanfo realzar  una valdiacion como esta 
//const isSensitive = SENSITIVE_KEY_SET.has(key)///k hace esta funcion y x k?


///Redaccion segura por  tipo de valor?
//let newValue = value;
/* let newValue: RedactedValue<typeof value>;

if(isObject(value)){
newValue = redactSecrets(
    value, 
    maxDepth, 
    currentDepth + 1, 
    visited
)
}else if (key === "passsword"  || key === "token" || key === "apiKey"){
    newValue = "***"; 
}else{
    newValue = value 
}

 */



/* if(isSensitiveKey(key)){
    newValue = redactValue(value);
}else if(isObject(value)){///cambio complemnatemnte 
newValue = redactSecrets(value)
}else if(Array.isArray(value)){
    newValue = value.map(item => isObject(item)? redactSecrets(item): item);
} */

  /*   return {
        ...acc, 
        [key]: newValue */
        //isSensitive? redactValue(value) : (typeof value === "object" && value !== null && !Array.isArray(value))? redactSecrets(value): value //como es posible usar la misma funcion dentro de la misma y eso no caussara un loop infinito ademas de explicar porque se destructura el acc ademas de que se utiliza el [ key] que hace esto y porque se realiza de esta manera ademas de que el que el  valor que tomara y porque ademas de que las ventajas y desvemntajas de utilziar este metodo y si es lo correcto pero epxlciar paso a paso que chace cada cosa  y como se relaicona con el codigo y con la funcion y como todo se ocmplementa

/*     };
}, {} as Redacted<T>)//porque se utilzia esta propiedad de objeto vacio como accumulador y se tipa cmo Redacteed CON un tipo generico
    
} */


//helpers para objeto 
/* const isObject= (value: unknown):value is object=> typeof value === "object" && value !==  null && !Array.isArray(value);

//verificar clave key de secrets 
const isSensitiveKey =(key: string): key is SensitiveKeys=>{
return SENSITIVE_KEY_SET.has(key)
}

///helper para valores 
const redactValue = (value: unknown): string=> {
if(value === null) return `***[null]`
if(value === undefined) return `***[undefined]`
if(typeof value !== "string") return `***[non-string]`
if(value === ``) return `***[empty]`

return `***${value.slice(-4)}`
}
 */


/* return Object.fromEntries(
        //por que se utilizan signo de array en parametros de map cuando aplciar esto que proposito y que ventajas  y edesventajas tiene esto cuando utilzairlo  y cuando no?
        Object.entries(obj).map(([key, value])=>{
            if(["apiKey", "apiSecret", "accessToken"].includes(key) && typeof value === "string"){
                const isSensitive =(key as string) in Sensitie
                return [key, `***${value.slice(-4)}`]
            }
            return [key, value]
        })
    ) as Redacted<T>//es buena practica tipaslo como un tipo deifnido en este caso y lo tome por defecto de que devolvera esto que es un redacted con este tipo genereico que en si no entiendo la razon de ser asi mas que  queja es duda que quisiera comprender  */ 