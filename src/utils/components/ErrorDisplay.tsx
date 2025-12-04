import { AppError } from "@/types/searchClasses"
import { AppErrorInterface } from "@/types/searchTypes"

interface ErrorDisplayProps{
    errors: AppErrorInterface[], 
    onRetry?: ()=> void;  //pporuqe aqui devuleve void? si utilizalroen si mismo ya en una mala practifca?y apararte no es que esta orpiedad es un boolean?
}

export const ErrorDisplay = ({errors, onRetry}: ErrorDisplayProps) => {

if(errors.length === 0) return null 
 const groupedErrors= errors.reduce((acc, error)=>{
const priority = error.priority;
if(!acc[priority]){
    acc[priority] = []
}

acc[priority].push(error)
return acc 
 }, {} as Record<string, AppErrorInterface[]>)//esta linea que significa //y acumulador entonces tendria todos los valores de errors como array?

const priorityOrder: AppErrorInterface["priority"] [] = ["critical", "high", "medium", "low"]//el moetivo de esta linea  y como se empata con groupedErrors o por que la existencia de esta linea 

//aquiisera  saber si no afecta el  hacer 2 maps encapsulados de esta manera y se o1 llega a dar resultados mas deificentes o no hay provblema o o se genera doble blucece com en un for ? ademas de que en error.code  porque se utiliza el onRetry  el porque se incluye en la ux  y como  afecta el utilizarlo o no 
    return (
    <div>
        {priorityOrder.map((priority)=>(
            groupedErrors[priority]?.map((error => (
                <div key={error.id}> 
                <span>{error.userMessage} </span>
                {error.code === "NETWORK_ERROR" && onRetry && (
                    <button onClick={onRetry}>
                        Reintentar
                    </button>
                )}
                </div>
            )))
        ))}


{/* esta pieza la tenia pensando poner pero dezconozco su tuilidad, proposito al iogual que qen relaidad que es lo que esta esperando aqui y si entonces si el codigo que provenga por .env si es igual a development si esto es  cierto entocnes se va a ejecutarb el lado derecho que es un jsx entocnes si no existe  no aparecera nada?  {process.env.NODE_ENV === 'development' && (
              <details className="error-details">
                <summary>Detalles técnicos</summary>
                <div className="error-details-content">
                  <p><strong>Código:</strong> {error.code}</p>
                  <p><strong>ID:</strong> {error.id}</p>
                  <p><strong>Hora:</strong> {new Date(error.timestamp).toLocaleString()}</p>
                  {error.metadata && (
                    <pre>{JSON.stringify(error.metadata, null, 2)}</pre>
                  )}
                </div>
              </details>
            )}
          </div>
        ))
      ))}
    </div> */}
    </div>
  )
}
