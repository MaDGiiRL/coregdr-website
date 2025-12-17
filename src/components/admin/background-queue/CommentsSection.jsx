import { motion } from "framer-motion";
import { MessageSquarePlus } from "lucide-react";
import RoleBadge from "./RoleBadge";

export default function CommentsSection({
  commentsLoading,
  comments,
  sortedComments,
  commentDraft,
  setCommentDraft,
  commentSending,
  updating,
  sendComment,
  reduce,
}) {
  return (
    <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
          <MessageSquarePlus className="w-4 h-4 text-[var(--color-text-muted)]" />
          Commenti staff
        </h3>
        <span className="text-[11px] text-[var(--color-text-muted)]">
          {commentsLoading ? "Caricamento..." : `${comments.length} commenti`}
        </span>
      </div>

      <div className="max-h-[320px] overflow-y-auto space-y-2 pr-1">
        {sortedComments.map((comment) => (
          <div
            key={comment.id}
            className="rounded-2xl border border-[var(--color-border)] bg-black/20 px-3 py-2"
          >
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-xs font-semibold truncate">
                  {comment.authorName}
                </span>
                <RoleBadge role={comment.authorRole} />
              </div>
              <span className="text-[10px] text-[var(--color-text-muted)]">
                {new Date(comment.createdAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>

            <div className="mt-1 max-h-[64px] overflow-y-auto">
              <p className="text-xs md:text-sm text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                {comment.message}
              </p>
            </div>
          </div>
        ))}

        {!commentsLoading && comments.length === 0 && (
          <p className="text-xs text-[var(--color-text-muted)]">
            Nessun commento.
          </p>
        )}
      </div>

      <textarea
        disabled={commentSending || updating}
        className="w-full min-h-[90px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
        placeholder="Scrivi un commento..."
        value={commentDraft}
        onChange={(e) => setCommentDraft(e.target.value)}
      />

      <div className="flex flex-wrap gap-2">
        <motion.button
          type="button"
          whileTap={{ scale: reduce ? 1 : 0.97 }}
          onClick={sendComment}
          disabled={commentSending}
          className="px-4 py-2 rounded-full font-semibold bg-white/10 text-white border border-[var(--color-border)] hover:bg-white/15 disabled:opacity-50 inline-flex items-center gap-2"
        >
          <MessageSquarePlus className="w-4 h-4" />
          {commentSending ? "Invio..." : "Invia commento"}
        </motion.button>
      </div>
    </section>
  );
};
