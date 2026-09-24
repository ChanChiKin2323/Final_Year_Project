import { useEffect, useState } from 'react'
import Title from '../../components/admin/Title'
import { useAppContext } from '../../context/AppContext'
import Loading from '../../components/Loading'
import toast from 'react-hot-toast'
import dateFormat from '../../lib/dateFormat'

const HandleRequests = () => {
  const { axios, getToken } = useAppContext()
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)

  const load = async () => {
    try {
      const { data } = await axios.get('/api/admin/requests', {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) setRequests(data.requests)
    } catch (error) {
      console.error(error)
    }
    setLoading(false)
  }

  const decide = async (id, action) => {
    try {
      const { data } = await axios.post(`/api/admin/requests/${id}/${action}`, {}, {
        headers: { Authorization: `Bearer ${await getToken()}` }
      })
      if (data.success) {
        toast.success(data.message)
        load()
      } else {
        toast.error(data.message)
      }
    } catch (error) {
      toast.error(error.message)
    }
  }

  useEffect(() => {
    load()
  }, [])

  if (loading) return <Loading />

  return (
    <>
      <Title text1="Handle" text2="Requests" />
      <div className="mt-8 max-w-4xl border border-line bg-surface">
        {requests.length === 0 ? (
          <p className="p-10 text-center text-sm text-muted">No admin requests waiting.</p>
        ) : (
          <ul>
            {requests.map((item) => (
              <li key={item._id} className="flex flex-col gap-4 border-b border-line p-5 last:border-none sm:flex-row sm:items-start sm:justify-between">
                <dl className="space-y-2 text-sm">
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Name</dt>
                    <dd className="font-display text-xl">{item.name}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Phone</dt>
                    <dd>{item.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Email</dt>
                    <dd>{item.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Reason</dt>
                    <dd className="max-w-xl whitespace-pre-wrap">{item.reason || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[0.62rem] uppercase tracking-[0.16em] text-muted">Anything else</dt>
                    <dd className="max-w-xl whitespace-pre-wrap">{item.note || '—'}</dd>
                  </div>
                  <p className="pt-1 text-[0.65rem] uppercase tracking-[0.16em] text-muted">{dateFormat(item.createdAt)}</p>
                </dl>
                <div className="flex gap-3">
                  <button onClick={() => decide(item._id, 'approve')}
                  className="cursor-pointer rounded-full bg-primary px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-canvas">
                    Approve
                  </button>
                  <button onClick={() => decide(item._id, 'reject')}
                  className="cursor-pointer rounded-full border border-accent px-5 py-2 text-[0.68rem] uppercase tracking-[0.16em] text-accent">
                    Disapprove
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  )
}

export default HandleRequests
