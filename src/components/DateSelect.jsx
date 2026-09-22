import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { useState } from "react"
import toast from 'react-hot-toast'
import { useNavigate } from "react-router-dom"
import parseDateKey from "../lib/dateKey"

const DataSelect = ({dateTime, id}) => {

    const [selected, setSelected] = useState(null)

    const navigate = useNavigate();

    const onBookHandler = ()=>{
        if(!selected){
            return toast('Please select a date')
        }
        navigate(`/movies/${id}/${selected}`)
        scrollTo(0,0)
    }

  return (
    <div id="dataSelect" className="mt-20 border-y border-ink bg-accent-soft">
        <div className="flex flex-col gap-8 p-8 md:flex-row md:items-end md:justify-between md:p-10">
            <div>
                <p className="text-[0.7rem] uppercase tracking-[0.28em] text-accent">Step one</p>
                <p className="mt-2 font-display text-2xl">Choose your date</p>

                <div className="mt-6 flex items-center gap-4 text-sm">
                    <ChevronLeftIcon className="h-5 w-5 shrink-0 text-muted" />
                    <span className="grid grid-cols-3 gap-3 md:flex md:max-w-lg md:flex-wrap">
                        {Object.keys(dateTime || {}).map((date)=>(
                            <button onClick={()=> setSelected(date)} key={date}
                            className={`flex h-16 w-16 cursor-pointer flex-col items-center justify-center
                            border transition ${selected === date
                                ? "border-ink bg-ink text-canvas"
                                : "border-ink/25 bg-surface hover:border-ink"}`}>
                                <span className="font-display text-xl leading-none">{parseDateKey(date).getDate()}</span>
                                <span className="mt-1 text-[0.65rem] uppercase tracking-[0.14em]">
                                    {parseDateKey(date).toLocaleDateString("en-US", {month: "short"})}
                                </span>
                            </button>
                        ))}
                    </span>
                    <ChevronRightIcon className="h-5 w-5 shrink-0 text-muted" />
                </div>
            </div>

            <button onClick={onBookHandler} className="bg-primary px-10 py-3.5 text-[0.72rem]
            uppercase tracking-[0.18em] text-canvas transition hover:bg-primary-dull
            cursor-pointer rounded-full">Book now</button>
        </div>
    </div>
  )
}

export default DataSelect
