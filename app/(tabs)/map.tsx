import { useCallback, useEffect, useState } from "react";
import { FlatList, Platform, Pressable, StyleSheet, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import * as Haptics from "expo-haptics";

import { RabbitAvatar } from "@/components/rabbit-avatar";
import { getLessonsForLevel, LEVELS } from "@/lib/learning-data";
import { DEFAULT_PROGRESS, type LearningProgress, isLevelUnlocked, loadProgress, markLevelCelebrated } from "@/lib/learning-progress";
import { ScreenContainer } from "@/components/screen-container";
import { ParticleCelebration } from "@/components/particle-celebration";
import { getLessonPerformanceLabel, isLessonRevisitable, needsReview } from "@/lib/lesson-flow";
import { getLowAccuracyLessonIdsForLevel } from "@/lib/learning-insights";

const tap = () => { if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); };

export default function MapScreen() {
  const router = useRouter();
  const { reviewLevelId, reviewOnly } = useLocalSearchParams<{ reviewLevelId?: string; reviewOnly?: string }>();
  const [progress, setProgress] = useState<LearningProgress>(DEFAULT_PROGRESS);
  const [celebratingLevel, setCelebratingLevel] = useState<string | null>(null);
  const [expandedLevelId, setExpandedLevelId] = useState<string | null>(null);
  const [reviewFilterLevelId, setReviewFilterLevelId] = useState<string | null>(null);

  useEffect(() => {
    if (reviewOnly === "true" && reviewLevelId && LEVELS.some((level) => level.id === reviewLevelId)) {
      setReviewFilterLevelId(reviewLevelId);
      setExpandedLevelId(reviewLevelId);
    }
  }, [reviewLevelId, reviewOnly]);

  const finishCelebration = useCallback(() => setCelebratingLevel(null), []);
  useFocusEffect(useCallback(() => {
    let active = true;
    loadProgress().then(async (next) => {
      if (!active) return;
      setProgress(next);
      const freshLevel = LEVELS.find((level) => {
        const lessons = getLessonsForLevel(level.id);
        return lessons.length > 0 && lessons.every((lesson) => next.completedLessonIds.includes(lesson.id)) && !next.celebratedLevelIds.includes(level.id);
      });
      if (freshLevel && active) {
        setCelebratingLevel(freshLevel.id);
        const updated = await markLevelCelebrated(freshLevel.id);
        if (active) setProgress(updated);
      }
    });
    return () => { active = false; };
  }, []));

  const reviewLevel = LEVELS.find((level) => level.id === reviewFilterLevelId);
  const clearReviewFilter = () => {
    tap();
    setReviewFilterLevelId(null);
    if (reviewLevelId || reviewOnly) router.setParams({ reviewLevelId: "", reviewOnly: "" });
  };

  return <ScreenContainer><View style={styles.page}>
    <FlatList
      data={LEVELS}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.content}
      ListHeaderComponent={<>
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>学习地图</Text>
            <Text style={styles.title}>56 个主题，慢慢走完</Text>
            <Text style={styles.subtitle}>每个等级都有 8 个生活化主题关卡。</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable accessibilityRole="button" accessibilityLabel="查看BOSS徽章墙" onPress={() => router.push("/badges" as never)} style={({ pressed }) => [styles.badgeWallButton, pressed && styles.pressed]}>
              <Text style={styles.badgeWallIcon}>🏅</Text><Text style={styles.badgeWallText}>徽章墙</Text>
            </Pressable>
            <RabbitAvatar size={58} />
          </View>
        </View>
        {reviewLevel ? <View style={styles.reviewBanner}>
          <View style={styles.reviewBannerCopy}><Text style={styles.reviewBannerTitle}>{reviewLevel.title} · 优先复练</Text><Text style={styles.reviewBannerBody}>仅显示最佳正确率低于 80% 的主题关，完成复练可刷新地图成绩。</Text></View>
          <Pressable accessibilityRole="button" accessibilityLabel="显示全部地图关卡" onPress={clearReviewFilter} style={({ pressed }) => [styles.clearReviewButton, pressed && styles.pressed]}><Text style={styles.clearReviewText}>查看全部</Text></Pressable>
        </View> : null}
      </>}
      renderItem={({ item, index }) => {
        const lessons = getLessonsForLevel(item.id);
        const completedCount = lessons.filter((lesson) => progress.completedLessonIds.includes(lesson.id)).length;
        const nextLesson = lessons.find((lesson) => !progress.completedLessonIds.includes(lesson.id)) ?? lessons[lessons.length - 1];
        const completed = completedCount === lessons.length;
        const unlocked = isLevelUnlocked(index, progress.completedLessonIds.length, lessons.length);
        const bossCompleted = progress.bossCompletedLevelIds.includes(item.id);
        const reviewOnlyForLevel = reviewFilterLevelId === item.id;
        const lowAccuracyLessonIds = new Set(getLowAccuracyLessonIdsForLevel(progress, item.id));
        const visibleLessons = reviewOnlyForLevel ? lessons.filter((lesson) => lowAccuracyLessonIds.has(lesson.id)) : lessons;
        const expanded = expandedLevelId === item.id;
        const headerLabel = reviewOnlyForLevel ? `${item.title}，正在显示${visibleLessons.length}个优先复练关卡` : `${item.title}，${completedCount}/${lessons.length}个关卡已完成，点击展开主题关`;

        return <View style={styles.levelGroup}>
          <Pressable accessibilityRole="button" accessibilityLabel={headerLabel} disabled={!unlocked} onPress={() => {
            tap();
            if (reviewOnlyForLevel) { clearReviewFilter(); setExpandedLevelId(item.id); return; }
            setExpandedLevelId(expanded ? null : item.id);
          }} style={({ pressed }) => [styles.levelCard, { borderColor: item.color, opacity: unlocked ? (pressed ? 0.82 : 1) : 0.48 }]}>
            <View style={[styles.levelBadge, { backgroundColor: item.color }]}><Text style={styles.levelBadgeText}>{item.icon}</Text></View>
            <View style={styles.levelText}>
              <Text style={styles.levelTitle}>{item.title}</Text>
              <Text style={styles.levelSubtitle}>{item.subtitle} · {lessons.length} 个主题关</Text>
              <Text style={styles.levelDescription}>{reviewOnlyForLevel ? `已筛选 ${visibleLessons.length} 个优先复练关卡` : completed ? "全部完成，BOSS 已解锁" : unlocked ? `已完成 ${completedCount}/${lessons.length} · 下一关：${nextLesson.title}` : "完成前序关卡后解锁"}</Text>
            </View>
            <View style={[styles.statusPill, { backgroundColor: reviewOnlyForLevel ? "#FFF0D7" : completed ? "#DDF5E5" : unlocked ? "#FFF0D7" : "#ECE9E3" }]}><Text style={[styles.statusText, { color: reviewOnlyForLevel ? "#B85A17" : completed ? "#277B3B" : unlocked ? "#B85A17" : "#85817C" }]}>{reviewOnlyForLevel ? `${visibleLessons.length}关` : completed ? "✓" : unlocked ? `${completedCount}/${lessons.length}` : "锁定"}</Text></View>
          </Pressable>

          {expanded ? <View style={styles.lessonList}>
            {visibleLessons.length ? visibleLessons.map((lesson) => {
              const lessonIndex = lessons.findIndex((candidate) => candidate.id === lesson.id);
              const finished = progress.completedLessonIds.includes(lesson.id);
              const available = isLessonRevisitable(lesson.id, progress.completedLessonIds, nextLesson.id);
              const accuracy = progress.lessonBestAccuracy[lesson.id];
              const stars = progress.lessonBestStars[lesson.id] ?? 0;
              const reviewRecommended = needsReview(accuracy);
              const performanceLabel = getLessonPerformanceLabel(accuracy);
              const performanceText = reviewRecommended ? `${performanceLabel}，建议复练` : performanceLabel;
              return <Pressable key={lesson.id} accessibilityRole="button" accessibilityLabel={`${lesson.title}${finished ? performanceText ? `，${performanceText}，已完成，可复练` : "，已完成，可复练" : available ? "，当前可挑战" : "，尚未解锁"}`} disabled={!available} onPress={() => { tap(); router.push({ pathname: "/lesson/[id]", params: { id: lesson.id } }); }} style={({ pressed }) => [styles.lessonRow, { borderLeftColor: item.color }, reviewRecommended && styles.lessonRowReview, !available && styles.lessonRowLocked, pressed && available && styles.pressed]}>
                <Text style={styles.lessonIndex}>{lessonIndex + 1}</Text>
                <View style={styles.lessonCopy}><Text style={styles.lessonRowTitle}>{lesson.title}</Text><Text style={styles.lessonRowState}>{finished ? performanceLabel ? "已完成 · 点此复练刷新成绩" : "已完成 · 下次复练刷新成绩" : available ? "当前关卡 · 开始挑战" : "完成前一关后解锁"}</Text></View>
                {finished && performanceLabel ? <View style={styles.lessonPerformance}><Text style={[styles.lessonAccuracy, reviewRecommended && styles.lessonAccuracyReview]}>{performanceLabel}</Text><Text style={styles.lessonStars}>{"★".repeat(stars)}{"☆".repeat(Math.max(0, 3 - stars))}</Text>{reviewRecommended ? <Text style={styles.lessonReviewLabel}>建议复练</Text> : null}</View> : null}
                <Text style={[styles.lessonAction, { color: item.color }]}>{finished ? "复练" : available ? "开始" : "🔒"}</Text>
              </Pressable>;
            }) : <View style={styles.emptyReview}><Text style={styles.emptyReviewTitle}>这一年级暂时没有优先复练关卡</Text><Text style={styles.emptyReviewBody}>完成更多主题关后，低于80%的成绩会自动显示在这里。</Text><Pressable accessibilityRole="button" accessibilityLabel="显示这一年级全部主题关" onPress={clearReviewFilter} style={({ pressed }) => [styles.emptyReviewButton, pressed && styles.pressed]}><Text style={styles.emptyReviewButtonText}>查看全部主题关</Text></Pressable></View>}
          </View> : null}

          {completed ? <Pressable accessibilityRole="button" accessibilityLabel={`${item.title}跨单元BOSS挑战`} onPress={() => router.push({ pathname: "/boss/[level]", params: { level: item.id } } as never)} style={({ pressed }) => [styles.bossCard, { borderColor: item.color, opacity: pressed ? 0.82 : 1 }]}><Text style={styles.bossIcon}>{bossCompleted ? "🏅" : "👑"}</Text><View style={styles.bossCopy}><Text style={styles.bossTitle}>{bossCompleted ? "等级星徽已点亮" : "跨单元 BOSS 挑战"}</Text><Text style={styles.bossBody}>{bossCompleted ? "获得 5 颗奖励星星，可再次挑战。" : "词义、词汇、语境、跟读四关合一。"}</Text></View><Text style={[styles.bossAction, { color: item.color }]}>{bossCompleted ? "再挑战" : "挑战"}</Text></Pressable> : null}
        </View>;
      }}
    />
    <ParticleCelebration visible={Boolean(celebratingLevel)} onFinished={finishCelebration} />
  </View></ScreenContainer>;
}

const styles = StyleSheet.create({
  page: { flex: 1 }, content: { padding: 20, paddingBottom: 110, gap: 13 }, pressed: { opacity: 0.72 }, levelGroup: { gap: 8 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }, headerCopy: { flex: 1, paddingRight: 8 }, headerActions: { flexDirection: "row", alignItems: "center", gap: 9 }, badgeWallButton: { backgroundColor: "#F3EEFF", borderRadius: 14, paddingVertical: 7, paddingHorizontal: 8, alignItems: "center" }, badgeWallIcon: { fontSize: 18 }, badgeWallText: { color: "#5D58B5", fontSize: 10, fontWeight: "900", marginTop: 1 }, eyebrow: { color: "#46A758", fontSize: 13, fontWeight: "800", letterSpacing: 0.4 }, title: { color: "#2E2A25", fontSize: 25, fontWeight: "900", marginTop: 4 }, subtitle: { color: "#736D65", fontSize: 14, lineHeight: 20, marginTop: 4, maxWidth: 250 },
  reviewBanner: { backgroundColor: "#FFF0D7", borderRadius: 18, padding: 13, flexDirection: "row", alignItems: "center", marginBottom: 3 }, reviewBannerCopy: { flex: 1, paddingRight: 8 }, reviewBannerTitle: { color: "#9D541B", fontSize: 13, fontWeight: "900" }, reviewBannerBody: { color: "#8A6542", fontSize: 11, lineHeight: 16, marginTop: 3 }, clearReviewButton: { backgroundColor: "#FFFFFF", borderRadius: 11, paddingHorizontal: 10, paddingVertical: 8 }, clearReviewText: { color: "#A75B1C", fontSize: 11, fontWeight: "900" },
  levelCard: { minHeight: 115, backgroundColor: "#FFFFFF", borderRadius: 22, borderWidth: 2, padding: 15, flexDirection: "row", alignItems: "center", shadowColor: "#4B3925", shadowOpacity: 0.07, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 }, levelBadge: { width: 54, height: 54, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 12 }, levelBadgeText: { fontSize: 25 }, levelText: { flex: 1 }, levelTitle: { color: "#2E2A25", fontWeight: "900", fontSize: 16 }, levelSubtitle: { color: "#6F6961", fontWeight: "700", fontSize: 12, marginTop: 3 }, levelDescription: { color: "#817A72", fontSize: 11, lineHeight: 16, marginTop: 4 }, statusPill: { minWidth: 44, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center", marginLeft: 8 }, statusText: { fontSize: 11, fontWeight: "900" },
  lessonList: { gap: 7, paddingHorizontal: 5, paddingTop: 2 }, lessonRow: { minHeight: 64, backgroundColor: "#FFFFFF", borderRadius: 14, borderLeftWidth: 4, paddingHorizontal: 12, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: "#F0E8DE" }, lessonRowReview: { backgroundColor: "#FFF9EF", borderColor: "#F5C56F" }, lessonRowLocked: { opacity: 0.48 }, lessonIndex: { width: 23, height: 23, borderRadius: 12, backgroundColor: "#F4F0EA", color: "#7B736B", fontSize: 11, fontWeight: "900", textAlign: "center", lineHeight: 23, marginRight: 9 }, lessonCopy: { flex: 1, paddingRight: 5 }, lessonRowTitle: { color: "#4A433B", fontSize: 12, fontWeight: "900" }, lessonRowState: { color: "#8A8178", fontSize: 10, marginTop: 3, fontWeight: "700" }, lessonPerformance: { alignItems: "flex-end", marginLeft: 4 }, lessonAccuracy: { color: "#347E4B", fontSize: 10, fontWeight: "900" }, lessonAccuracyReview: { color: "#B86719" }, lessonStars: { color: "#E4A329", fontSize: 11, letterSpacing: -1, marginTop: 2 }, lessonReviewLabel: { color: "#B86719", fontSize: 9, fontWeight: "900", marginTop: 1 }, lessonAction: { fontSize: 11, fontWeight: "900", marginLeft: 8 },
  emptyReview: { backgroundColor: "#FFFFFF", borderRadius: 16, padding: 15, borderWidth: 1, borderColor: "#F0E8DE" }, emptyReviewTitle: { color: "#564C43", fontSize: 13, fontWeight: "900" }, emptyReviewBody: { color: "#887E74", fontSize: 11, lineHeight: 16, marginTop: 4 }, emptyReviewButton: { alignSelf: "flex-start", backgroundColor: "#FFF0D7", borderRadius: 11, paddingVertical: 8, paddingHorizontal: 10, marginTop: 10 }, emptyReviewButtonText: { color: "#A65B1B", fontSize: 11, fontWeight: "900" },
  bossCard: { backgroundColor: "#FFF8EA", borderRadius: 18, borderWidth: 1.5, padding: 13, flexDirection: "row", alignItems: "center" }, bossIcon: { fontSize: 24, marginRight: 10 }, bossCopy: { flex: 1 }, bossTitle: { color: "#3F3832", fontSize: 13, fontWeight: "900" }, bossBody: { color: "#7C7369", fontSize: 11, marginTop: 3, lineHeight: 16 }, bossAction: { fontSize: 12, fontWeight: "900", marginLeft: 8 },
});
