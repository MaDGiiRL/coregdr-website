import { motion, AnimatePresence } from "framer-motion";
import {
  Lock,
  Info,
  CheckCircle2,
  XCircle,
  Pencil,
  Save,
  Ban,
} from "lucide-react";
import { STATUS_LABELS, statusPill } from "./ui";
import JobEditor from "./JobEditor";
import CommentsSection from "./CommentsSection";

export default function BackgroundDetail({
  selected,
  shellCard,
  reduce,

  isLocked,

  // job
  canEditJob,
  jobSaving,
  jobDraft,
  setJobDraft,
  saveJob,
  clearJob,

  // edit bg text
  canEditBgText,
  editMode,
  editDraft,
  setEditDraft,
  startEdit,
  saveEdit,
  cancelEdit,

  // actions
  updating,
  handleApprove,
  handleReject,

  // comments
  commentsLoading,
  comments,
  sortedComments,
  commentDraft,
  setCommentDraft,
  commentSending,
  sendComment,
}) {
  return (
    <AnimatePresence mode="wait">
      {selected ? (
        <motion.div
          key={selected.id}
          initial={{ opacity: 0, y: reduce ? 0 : 10 }}
          animate={{ opacity: 1, y: 0, transition: { duration: 0.2 } }}
          exit={{
            opacity: 0,
            y: reduce ? 0 : -8,
            transition: { duration: 0.15 },
          }}
          className={`${shellCard} p-4 md:p-5 space-y-4`}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--color-text-muted)]">
                Background
              </p>
              <h2 className="text-lg md:text-xl font-semibold truncate">
                {selected.nome} {selected.cognome}
              </h2>

              <p className="text-xs text-[var(--color-text-muted)]">
                <span className="truncate">
                  {selected.discordName} • ID:{" "}
                  <span className="font-mono">{selected.discordId}</span>
                  {selected.job ? (
                    <>
                      <span className="mx-2 opacity-50">•</span>
                      Job:{" "}
                      <span className="font-semibold text-white/80">
                        {selected.job}
                      </span>
                    </>
                  ) : null}
                </span>
              </p>
            </div>

            <div className="flex flex-col items-end gap-1 text-[10px] text-[var(--color-text-muted)]">
              <span
                className={`px-3 py-1 rounded-full border text-[10px] ${statusPill(
                  selected.status
                )}`}
              >
                {STATUS_LABELS[selected.status]}
              </span>
              <span>
                Inviato:{" "}
                {new Date(selected.submittedAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
              <span>
                Ultimo agg.:{" "}
                {new Date(selected.lastUpdatedAt).toLocaleString("it-IT", {
                  dateStyle: "short",
                  timeStyle: "short",
                })}
              </span>
            </div>
          </div>

          {isLocked && (
            <div className="rounded-2xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 mt-0.5 text-emerald-300" />
                <div>
                  <p className="font-semibold text-emerald-200">
                    Background approvato – stato bloccato
                  </p>
                  <p className="text-xs text-emerald-200/80">
                    Lo stato non può più cambiare, ma Job e Commenti restano
                    modificabili.
                  </p>
                </div>
              </div>
            </div>
          )}

          <JobEditor
            canEditJob={canEditJob}
            jobSaving={jobSaving}
            jobDraft={jobDraft}
            setJobDraft={setJobDraft}
            saveJob={saveJob}
            clearJob={clearJob}
            reduce={reduce}
          />

          <div className="space-y-4 text-xs md:text-sm">
            <section className="rounded-2xl bg-black/20 border border-[var(--color-border)] p-3 md:p-4 space-y-2">
              <h3 className="font-semibold text-sm md:text-base flex items-center gap-2">
                <Info className="w-4 h-4 text-[var(--color-text-muted)]" />
                II. Storia del personaggio
              </h3>

              <div>
                <p className="text-[11px] text-[var(--color-text-muted)] mb-1">
                  Storia in breve
                </p>

                {editMode ? (
                  <textarea
                    disabled={updating || isLocked}
                    className="w-full min-h-[110px] rounded-2xl bg-[#111326] border border-[var(--color-border)] px-3 py-2 text-xs md:text-sm outline-none focus:border-[var(--blue)] resize-y disabled:opacity-50"
                    value={editDraft.storiaBreve}
                    onChange={(e) =>
                      setEditDraft((prev) => ({
                        ...prev,
                        storiaBreve: e.target.value,
                      }))
                    }
                  />
                ) : (
                  <p className="text-[var(--color-text)] whitespace-pre-line leading-relaxed">
                    {selected.data.storiaBreve || "-"}
                  </p>
                )}
              </div>
            </section>

            <CommentsSection
              commentsLoading={commentsLoading}
              comments={comments}
              sortedComments={sortedComments}
              commentDraft={commentDraft}
              setCommentDraft={setCommentDraft}
              commentSending={commentSending}
              updating={updating}
              sendComment={sendComment}
              reduce={reduce}
            />
          </div>

          <div className="mt-2 border-t border-[var(--color-border)] pt-4 space-y-3">
            {!editMode ? (
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <motion.button
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.97 }}
                  onClick={handleApprove}
                  disabled={updating || isLocked}
                  className="px-4 py-2 rounded-full font-semibold bg-emerald-500/90 text-[#050816] shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approva
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.97 }}
                  onClick={handleReject}
                  disabled={updating || isLocked}
                  className="px-4 py-2 rounded-full font-semibold bg-red-500/90 text-white shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <XCircle className="w-4 h-4" />
                  Rifiuta
                </motion.button>

                {canEditBgText && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: reduce ? 1 : 0.97 }}
                    onClick={startEdit}
                    disabled={updating || isLocked}
                    className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 inline-flex items-center gap-2 disabled:opacity-50"
                  >
                    <Pencil className="w-4 h-4" />
                    Modifica BG
                  </motion.button>
                )}
              </div>
            ) : (
              <div className="flex flex-wrap gap-2 text-xs md:text-sm">
                <motion.button
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.97 }}
                  onClick={saveEdit}
                  disabled={updating || isLocked}
                  className="px-4 py-2 rounded-full font-semibold bg-[var(--blue)] text-[#050816] shadow-md hover:brightness-110 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salva modifiche
                </motion.button>

                <motion.button
                  type="button"
                  whileTap={{ scale: reduce ? 1 : 0.97 }}
                  onClick={cancelEdit}
                  disabled={updating}
                  className="px-4 py-2 rounded-full font-semibold border border-[var(--color-border)] text-[var(--color-text-muted)] hover:bg-white/5 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  <Ban className="w-4 h-4" />
                  Annulla
                </motion.button>
              </div>
            )}
          </div>
        </motion.div>
      ) : (
        <motion.p
          key="empty"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-sm text-[var(--color-text-muted)]"
        >
          Nessun background selezionato.
        </motion.p>
      )}
    </AnimatePresence>
  );
}
