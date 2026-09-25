import { useEffect, useState } from "react"
import { StarIcon } from "lucide-react"
import toast from "react-hot-toast"
import { useAppContext } from "../context/AppContext"

const CommentSection = ({ movieId, comments, myStars, onSaved }) => {
    const { axios, user, getToken } = useAppContext()
    const mine = comments.find((comment) => comment.mine)
    const [text, setText] = useState(mine?.text || '')
    const [stars, setStars] = useState(mine?.stars || myStars || 0)
    const [hoverStars, setHoverStars] = useState(0)
    const [saving, setSaving] = useState(false)

    useEffect(() => {
        if (myStars) setStars(myStars)
    }, [myStars])

    const handleSubmit = async (event) => {
        event.preventDefault()
        if (!user) return toast.error('Sign in to comment')
        if (!stars) return toast.error('Choose a rating from 1 to 5 stars')
        if (!text.trim()) return toast.error('Write how this film felt')

        try {
            setSaving(true)
            const { data } = await axios.post(`/api/show/${movieId}/comment`, {
                text: text.trim(),
                stars,
            }, {
                headers: { Authorization: `Bearer ${await getToken()}` }
            })
            if (data.success) {
                onSaved(data)
                toast.success(data.message)
            } else {
                toast.error(data.message)
            }
        } catch (error) {
            toast.error(error.response?.data?.message || error.message)
        }
        setSaving(false)
    }

    return (
        <section className="mt-20">
            <p className="border-b border-line pb-4 text-[0.7rem] uppercase tracking-[0.24em] text-muted">
                Comments
            </p>

            <form onSubmit={handleSubmit} className="mt-8 max-w-2xl border border-line bg-surface p-6">
                <p className="font-display text-2xl">How did this film feel?</p>
                <p className="mt-2 text-sm text-muted">Your comment includes the stars you give it.</p>

                <div className="mt-5 flex items-center gap-1" onMouseLeave={() => setHoverStars(0)}>
                    {[1, 2, 3, 4, 5].map((star) => {
                        const active = star <= (hoverStars || stars)
                        return (
                            <button key={star} type="button" aria-label={`${star} star`}
                            onMouseEnter={() => setHoverStars(star)}
                            onClick={() => setStars(star)}
                            className="cursor-pointer">
                                <StarIcon className={`h-5 w-5 ${active ? 'fill-accent text-accent' : 'text-muted'}`} />
                            </button>
                        )
                    })}
                </div>

                <textarea value={text} maxLength={400} rows={4}
                onChange={(event) => setText(event.target.value)}
                placeholder="What stayed with you after the screening?"
                className="mt-5 w-full resize-none border border-line bg-canvas px-4 py-3 text-sm outline-none focus:border-ink" />

                <div className="mt-4 flex items-center justify-between gap-4">
                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">{text.trim().length}/400</p>
                    <button type="submit" disabled={saving}
                    className="cursor-pointer rounded-full bg-primary px-8 py-3 text-[0.72rem] uppercase tracking-[0.18em] text-canvas transition hover:bg-primary-dull disabled:opacity-60">
                        {mine ? 'Update comment' : 'Post comment'}
                    </button>
                </div>
            </form>

            {comments.length === 0 ? (
                <p className="mt-8 text-sm text-muted">No comments yet.</p>
            ) : (
                <ul className="mt-8 max-w-2xl divide-y divide-line border border-line bg-surface">
                    {comments.map((comment) => (
                        <li key={comment._id} className="flex gap-4 p-5">
                            {comment.image ? (
                                <img src={comment.image} alt="" className="h-10 w-10 shrink-0 border border-line object-cover" />
                            ) : (
                                <span className="grid h-10 w-10 shrink-0 place-items-center border border-line text-sm">
                                    {comment.name?.[0] || '?'}
                                </span>
                            )}
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <p className="text-sm">{comment.name}</p>
                                    <span className="flex items-center gap-0.5">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <StarIcon key={star} className={`h-3.5 w-3.5 ${star <= comment.stars ? 'fill-accent text-accent' : 'text-line'}`} />
                                        ))}
                                    </span>
                                    <p className="text-[0.65rem] uppercase tracking-[0.14em] text-muted">
                                        {new Date(comment.createdAt).toLocaleDateString('en-GB', {
                                            day: 'numeric', month: 'short', year: 'numeric'
                                        })}
                                    </p>
                                </div>
                                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-muted">{comment.text}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </section>
    )
}

export default CommentSection
