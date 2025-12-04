
import { querySchema } from "@/schemas/querySchemas";
import { AppError, NetworkError } from "@/types/searchClasses";
import { AppErrorInterface, PokeDataType } from "@/types/searchTypes";
import { normalizeError } from "@/utils/normalizeError";

import { useCallback, useEffect, useRef, useState } from "react";

interface SearchState{
    data: PokeDataType | null; 
    isLoading: boolean; 
    isAborted: boolean; 
    errors: AppErrorInterface[]
}



export const useSearch = () => {
    //estado unificado para garantizar consistencia 
    const[state, setState] = useState<SearchState>({
        data: null, 
        isLoading: false, 
        isAborted: false, 
        errors: []
    })
//referencia mutable para el AbortController
const abortRef = useRef<AbortController | null>(null)

//efecto de limpieza al desmmontar 
useEffect(()=>{
    return ()=>{
        abortRef.current?.abort()//cancela cualquier peticion pendinete 
    }//me gustaria scomprender  y enetedner mas como funciona esto y cual es el immpacto de esto
}, [])


const search = useCallback(async(query: string)=>{
//cancelar peticion anterior si existe 
abortRef.current?.abort()
abortRef.current = new AbortController()

//resetea estado (conservando datos previos)
setState(prev=> ({
    ...prev, 
    isLoading: true, 
    isAborted: false, //aqui me surge  curiosidad de cual es el impacto y proque es necesario crear el aborted false si los datos previos se conservan teniedno en cuenta que  se hace un abort y se crea uno nuevo adeams eniendo el loading y erros que es una sobreescritura necesaria pero cual es el propisto, efcto que tiene el sobreescribir la sata previa ?  
    errors: []
}))
try {
   //Validacion con Zod
    const validation = await querySchema.safeParseAsync(query)
    if(!validation.success)  {
        console.log(validation.error)
        //mapeo de errores de zod a AppError //aqui no se podria realziar una normalizacion del error y devolver el resultado? 
        const validationErrors = validation.error.issues.map(issue=> ({
            id: `val-${Date.now()}-${Math.random().toString(16).slice(2)}`, 
            code: "VALIDATION_ERROR", 
            userMessage: `Validation error in ${issue.path.join(".")}: ${issue.message}`, 
            technicalMessage: issue.message, 
            priority: `medium` as const,  //porque el como constante si es un string 
            timestamp: Date.now(),
            metadata: {
                path: issue.path, 
                code: issue.code
            } 
        }))

        setState(prev=> ({...prev, errors: validationErrors}))
        return //Corta ejecucicion si hay errores/pero porque corta la ejecucion si hhay errores a que se debe y como implementar esta accion correctamente y a que se diefferencia  de un return normal o directo 
    }

    //Petricion a API con manejo de erores HTTPT 
    const response =  await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(query)}`, {
    signal: abortRef.current.signal
    })

    if(!response.ok){
        //Lanza error especifico segun status code 
        console.log(response)
        throw new NetworkError(
            `HTTP_${response.status}`, 
            `Request failed with status ${response.status}`, 
            response.status === 404 ? `Pokemon no encontrado`: "error al buscar pokemon", 
            response.status >= 500? "high" : "critical", 
            response.status !== 404//no retintentar en 404 //ocupo profundizar mas en donde proporicnar esta propiedad de reintentos 
        )
    }

///Procedimietno de repsuesta exitosa 
const data = await response.json()//este metodo de hacr un if en caso de que sea  diferente a ok y agarar los datos de esta manera y tranformarlos a json es mejor que hacer un try catch? o porque se  lige este  enfoque ? y cuanto afecta o que ta buena practica es realizar este metodo 
setState({
    data: data.abilities?.length ? data : {name: "", abilities: []}, 
    isLoading: false, 
    isAborted: false, 
    errors: []
})
//me gusta este metodo de estaods centralizados en uno solo para mejor manejo pero realmente es buena pratcia? se puede utilizar sin problemas  en cuanto a buenas practcas se refiere ??

} catch (error) {
    console.log(error)
    //Manejo centralizado de eerrores 
    if(error instanceof DOMException && error.name === "AbortError"){
        setState(prev=>({...prev, isAborted: true, isLoading: false}))
        return//este  refturn similar al otro que corta een caso de errores me pregunto como afecta el aocmodo de estos returns
    }

    //Normalizacion del error 
    //const normalizedError = error instanceof AppError ? error : normalizeError(error);//tuve que comentarlo ya  que me salia el mensaje de error de abajo que quisiera me pduieras explciar por los mistivos que un momento te comente que era o que  deovlvia la clase y las propiedades altantes a comparacionde la interfaz 
 const normalizedError = normalizeError(error);
    //osea si el error proviene de APPError o una subClase que haya heredado de App Error que es el padre y las NetworkError etc son las subclases  y al pertenecer al mismo tipo y devolcveer el mismo formato de error por eso devileve y si no entonces noramaliza en caso dsea zod Error o desconocido ?

/* Argument of type '(prev: SearchState) => { isLoading: false; errors: (AppErrorInterface | AppError)[]; data: PokeDataType | null; isAborted: boolean; }' is not assignable to parameter of type 'SetStateAction<SearchState>'.
  Type '(prev: SearchState) => { isLoading: false; errors: (AppErrorInterface | AppError)[]; data: PokeDataType | null; isAborted: boolean; }' is not assignable to type '(prevState: SearchState) => SearchState'.
    Call signature return types '{ isLoading: false; errors: (AppErrorInterface | AppError)[]; data: PokeDataType | null; isAborted: boolean; }' and 'SearchState' are incompatible.
      The types of 'errors' are incompatible between these types.
        Type '(AppErrorInterface | AppError)[]' is not assignable to type 'AppErrorInterface[]'.
          Type 'AppErrorInterface | AppError' is not assignable to type 'AppErrorInterface'.
            Type 'AppError' is missing the following properties from type 'AppErrorInterface': id, technicalMessagets(2345)
⚠ Error (TS2345)  | 

Argument of type:
is not assignable to parameter of type 
 .
   

Type:
is not assignable to type 
 .
          	Call signature return types:
and 
 are incompatible.
                	The types of errors are incompatible between these types.
                      	Type 
 is not assignable to type 
 .
                            	Type 
 is not assignable to type 
 .
                                  	Type 
 is missing the following properties from type 
 :
id
technicalMessage */

setState(prev=> ({
    ...prev,
    isLoading: false, 
    errors: [...prev.errors, normalizedError]  
}))
}
}, [])//para que funciona el parametros de useCallBack y acual es el efecto de no poner nada a poenr algo y cuando utiizar cad a uno 

//Funcion para  canncelacion manual 
const  abort  = useCallback(()=>{
abortRef.current?.abort()
setState(prev=>({...prev, isLoading: false, isAborted: true}))
}, [])



//aqui abajo por que se hace un spred del estado llamado state ? en vez de mandarlo como tal  osea state en vez de ...state 
  return (
    {...state, search, abort}
  )
}

