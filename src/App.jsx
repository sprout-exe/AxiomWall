import { evaluate } from './engine'

export default function App() {
  console.log(evaluate({}))
  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold">PhysGuard</h1>
      <p className="mt-2 text-sm">Physics checks what passwords can't.</p>
      <div className="mt-6 rounded-3xl bg-ink p-6 text-white">
        <span className="rounded-full bg-lime px-3 py-1 text-ink">Digital: VALID</span>
      </div>
    </div>
  )
}