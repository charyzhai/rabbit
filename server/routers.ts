import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { transcribeAudio } from "./_core/voiceTranscription";
import { storagePut } from "./storage";
import { calculatePronunciationScore } from "../shared/speech-scoring";
import { getEncryptedSyncPack, upsertEncryptedSyncPack } from "./db";
import { z } from "zod";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  speech: router({
    grade: publicProcedure.input(z.object({
      targetText: z.string().min(1).max(300),
      audioBase64: z.string().min(100).max(8_000_000),
      mimeType: z.enum(["audio/m4a", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg"]).default("audio/m4a"),
    })).mutation(async ({ ctx, input }) => {
      const extension = input.mimeType.includes("wav") ? "wav" : input.mimeType.includes("webm") ? "webm" : input.mimeType.includes("ogg") ? "ogg" : "m4a";
      const audio = Buffer.from(input.audioBase64, "base64");
      if (audio.length > 6_000_000) throw new Error("录音文件过大，请控制在30秒以内后重试。");
      const uploaded = await storagePut(`speech-practice/${Date.now()}.${extension}`, audio, input.mimeType);
      const host = ctx.req.get("host");
      if (!host) throw new Error("无法确定音频服务地址。");
      const audioUrl = `${ctx.req.protocol}://${host}${uploaded.url}`;
      const transcription = await transcribeAudio({ audioUrl, language: "en", prompt: `The learner is reading this English text: ${input.targetText}` });
      const transcript = "text" in transcription ? transcription.text ?? "" : "";
      if (!transcript) throw new Error("未能识别清晰英文内容，请靠近麦克风并在安静环境下再试一次。");
      const result = calculatePronunciationScore(input.targetText, transcript);
      return { transcript, ...result };
    }),
  }),
  dictionary: router({
    lookup: publicProcedure.input(z.object({ word: z.string().trim().min(1).max(48).regex(/^[a-zA-Z-]+$/) })).query(async ({ input }) => {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(input.word.toLowerCase())}`);
      if (!response.ok) return { word: input.word, phonetic: "", audioUrl: null, source: "device-fallback" as const };
      const entries = await response.json() as Array<{ phonetic?: string; phonetics?: Array<{ text?: string; audio?: string }> }>;
      const phonetics = entries.flatMap((entry) => entry.phonetics ?? []);
      const audio = phonetics.find((item) => item.audio)?.audio ?? "";
      const phonetic = phonetics.find((item) => item.text)?.text ?? entries[0]?.phonetic ?? "";
      return { word: input.word, phonetic, audioUrl: audio ? (audio.startsWith("//") ? `https:${audio}` : audio) : null, source: audio ? "online-audio" as const : "device-fallback" as const };
    }),
  }),
  sync: router({
    upload: publicProcedure.input(z.object({ syncCode: z.string().regex(/^[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/), encryptedPayload: z.string().min(80).max(2_500_000) })).mutation(({ input }) => upsertEncryptedSyncPack(input.syncCode, input.encryptedPayload)),
    get: publicProcedure.input(z.object({ syncCode: z.string().regex(/^[A-F0-9]{5}-[A-F0-9]{5}-[A-F0-9]{5}$/) })).query(async ({ input }) => { const pack = await getEncryptedSyncPack(input.syncCode); return pack ? { encryptedPayload: pack.encryptedPayload, updatedAt: pack.updatedAt } : null; }),
  }),

  // TODO: add feature routers here, e.g.
  // todo: router({
  //   list: protectedProcedure.query(({ ctx }) =>
  //     db.getUserTodos(ctx.user.id)
  //   ),
  // }),
});

export type AppRouter = typeof appRouter;
