import React, { useCallback, useState } from "react";
import { useEditorStore } from "./useEditorStore";
import type { MorphTimeline, MorphTrack } from "../types";

// =============================================================
// TimelineEditorPanel — トラック表示、キーフレーム操作UI
// §14 タイムラインエディタ
// =============================================================

export function TimelineEditorPanel() {
  const collapsedPanels = useEditorStore((s) => s.collapsedPanels);
  const togglePanel = useEditorStore((s) => s.togglePanel);
  const isCollapsed = collapsedPanels["timeline_editor"] ?? false;

  const [timelines, setTimelines] = useState<Record<string, MorphTimeline>>({});
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<number | null>(null);
  const [selectedKfIndex, setSelectedKfIndex] = useState<number | null>(null);

  const selectedTimeline = selectedTimelineId ? timelines[selectedTimelineId] ?? null : null;
  const selectedTrack = selectedTimeline && selectedTrackIndex !== null
    ? selectedTimeline.tracks[selectedTrackIndex] ?? null
    : null;
  const selectedKf = selectedTrack && selectedKfIndex !== null
    ? selectedTrack.keyframes[selectedKfIndex] ?? null
    : null;

  const totalDuration = selectedTimeline?.totalDuration ?? 1;

  const handleAddTimeline = useCallback(() => {
    const id = `timeline_${Date.now()}`;
    const newTimeline: MorphTimeline = {
      trigger: { type: "always" },
      loop: false,
      yoyo: false,
      totalDuration: 2,
      tracks: [],
    };
    setTimelines((prev) => ({ ...prev, [id]: newTimeline }));
    setSelectedTimelineId(id);
  }, []);

  const handleDeleteTimeline = useCallback((id: string) => {
    setTimelines((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    if (selectedTimelineId === id) {
      setSelectedTimelineId(null);
      setSelectedTrackIndex(null);
      setSelectedKfIndex(null);
    }
  }, [selectedTimelineId]);

  const handleAddTrack = useCallback(() => {
    if (!selectedTimelineId) return;
    const morphName = prompt("Morph target name:", "eye");
    if (!morphName) return;
    const newTrack: MorphTrack = {
      morphName,
      keyframes: [
        { time: 0, value: 0, ease: "linear" },
        { time: totalDuration, value: 1, ease: "linear" },
      ],
    };
    setTimelines((prev) => ({
      ...prev,
      [selectedTimelineId]: {
        ...prev[selectedTimelineId],
        tracks: [...prev[selectedTimelineId].tracks, newTrack],
      },
    }));
  }, [selectedTimelineId, totalDuration]);

  const handleDeleteTrack = useCallback((index: number) => {
    if (!selectedTimelineId) return;
    setTimelines((prev) => ({
      ...prev,
      [selectedTimelineId]: {
        ...prev[selectedTimelineId],
        tracks: prev[selectedTimelineId].tracks.filter((_, i) => i !== index),
      },
    }));
    setSelectedTrackIndex(null);
    setSelectedKfIndex(null);
  }, [selectedTimelineId]);

  const handleUpdateDuration = useCallback((duration: number) => {
    if (!selectedTimelineId) return;
    setTimelines((prev) => ({
      ...prev,
      [selectedTimelineId]: { ...prev[selectedTimelineId], totalDuration: duration },
    }));
  }, [selectedTimelineId]);

  const handleUpdateKf = useCallback((field: "time" | "value" | "ease", value: string) => {
    if (!selectedTimelineId || selectedTrackIndex === null || selectedKfIndex === null) return;
    setTimelines((prev) => {
      const timeline = { ...prev[selectedTimelineId] };
      const tracks = [...timeline.tracks];
      const kfs = [...tracks[selectedTrackIndex].keyframes];
      const kf = { ...kfs[selectedKfIndex] };
      if (field === "time" || field === "value") {
        kf[field] = parseFloat(value);
      } else {
        kf.ease = value;
      }
      kfs[selectedKfIndex] = kf;
      tracks[selectedTrackIndex] = { ...tracks[selectedTrackIndex], keyframes: kfs };
      timeline.tracks = tracks;
      return { ...prev, [selectedTimelineId]: timeline };
    });
  }, [selectedTimelineId, selectedTrackIndex, selectedKfIndex]);

  const handleDownloadTimeline = useCallback(() => {
    const json = JSON.stringify(timelines, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "timelines.json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [timelines]);

  return (
    <PanelShell title="Timeline Editor" panelId="timeline_editor" isCollapsed={isCollapsed} onToggle={togglePanel}>
      {/* タイムライン一覧 */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
        <button
          onClick={handleAddTimeline}
          style={{
            padding: "2px 8px",
            background: "rgba(255,255,255,0.05)",
            border: "1px solid rgba(255,255,255,0.15)",
            color: "#e0e0e0",
            cursor: "pointer",
            fontSize: "10px",
            fontFamily: "monospace",
          }}
        >
          + New Timeline
        </button>
        {Object.keys(timelines).length > 0 && (
          <button
            onClick={handleDownloadTimeline}
            style={{
              padding: "2px 8px",
              background: "rgba(255,204,0,0.1)",
              border: "1px solid #ffcc00",
              color: "#ffcc00",
              cursor: "pointer",
              fontSize: "10px",
              fontFamily: "monospace",
            }}
          >
            Download JSON
          </button>
        )}
      </div>

      {/* タイムライン選択 */}
      {Object.keys(timelines).length > 0 && (
        <div style={{ display: "flex", gap: "4px", marginBottom: "6px", flexWrap: "wrap" }}>
          {Object.keys(timelines).map((id) => (
            <span
              key={id}
              onClick={() => {
                setSelectedTimelineId(id);
                setSelectedTrackIndex(null);
                setSelectedKfIndex(null);
              }}
              style={{
                padding: "2px 6px",
                background: selectedTimelineId === id ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.05)",
                border: `1px solid ${selectedTimelineId === id ? "#ffcc00" : "rgba(255,255,255,0.15)"}`,
                color: selectedTimelineId === id ? "#ffcc00" : "#aaa",
                cursor: "pointer",
                fontSize: "9px",
                fontFamily: "monospace",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
              }}
            >
              {id.replace("timeline_", "TL")}
              <span
                onClick={(e) => {
                  e.stopPropagation();
                  handleDeleteTimeline(id);
                }}
                style={{ color: "#ff4444", cursor: "pointer", fontSize: "10px" }}
              >
                ×
              </span>
            </span>
          ))}
        </div>
      )}

      {/* 選択中タイムラインの編集 */}
      {selectedTimeline && (
        <>
          {/* 基本設定 */}
          <div style={{ display: "flex", gap: "8px", marginBottom: "6px", alignItems: "center" }}>
            <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
              Duration:
              <input
                type="number"
                value={selectedTimeline.totalDuration}
                onChange={(e) => handleUpdateDuration(parseFloat(e.target.value))}
                step={0.1}
                min={0.1}
                style={{
                  width: "50px",
                  marginLeft: "4px",
                  background: "rgba(0,0,0,0.3)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#e0e0e0",
                  padding: "1px 2px",
                  fontSize: "10px",
                  fontFamily: "monospace",
                  textAlign: "right",
                }}
              />
              s
            </label>
            <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
              <input
                type="checkbox"
                checked={selectedTimeline.loop}
                onChange={(e) =>
                  setTimelines((prev) => ({
                    ...prev,
                    [selectedTimelineId!]: { ...prev[selectedTimelineId!], loop: e.target.checked },
                  }))
                }
                style={{ verticalAlign: "middle", marginRight: "2px" }}
              />
              Loop
            </label>
            <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
              <input
                type="checkbox"
                checked={selectedTimeline.yoyo}
                onChange={(e) =>
                  setTimelines((prev) => ({
                    ...prev,
                    [selectedTimelineId!]: { ...prev[selectedTimelineId!], yoyo: e.target.checked },
                  }))
                }
                style={{ verticalAlign: "middle", marginRight: "2px" }}
              />
              Yoyo
            </label>
          </div>

          {/* トラック一覧 */}
          <div style={{ marginBottom: "4px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
              <span style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>Tracks</span>
              <button
                onClick={handleAddTrack}
                style={{
                  padding: "1px 6px",
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#e0e0e0",
                  cursor: "pointer",
                  fontSize: "9px",
                  fontFamily: "monospace",
                }}
              >
                + Track
              </button>
            </div>
            {selectedTimeline.tracks.map((track, ti) => (
              <div
                key={ti}
                onClick={() => {
                  setSelectedTrackIndex(ti);
                  setSelectedKfIndex(null);
                }}
                style={{
                  padding: "2px 6px",
                  marginBottom: "2px",
                  background: selectedTrackIndex === ti ? "rgba(255,204,0,0.1)" : "rgba(255,255,255,0.02)",
                  border: `1px solid ${selectedTrackIndex === ti ? "rgba(255,204,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: "9px", color: "#ccc", fontFamily: "monospace" }}>
                  {track.morphName} ({track.keyframes.length} kf)
                </span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTrack(ti);
                  }}
                  style={{
                    background: "none",
                    border: "none",
                    color: "#ff4444",
                    cursor: "pointer",
                    fontSize: "10px",
                  }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>

          {/* キーフレーム一覧 */}
          {selectedTrack && (
            <div style={{ marginBottom: "6px" }}>
              <div style={{ fontSize: "9px", color: "#888", fontFamily: "monospace", marginBottom: "2px" }}>
                Keyframes — {selectedTrack.morphName}
              </div>
              <div style={{ maxHeight: "120px", overflowY: "auto" }}>
                {selectedTrack.keyframes.map((kf, ki) => (
                  <div
                    key={ki}
                    onClick={() => setSelectedKfIndex(ki)}
                    style={{
                      padding: "2px 6px",
                      marginBottom: "1px",
                      background: selectedKfIndex === ki ? "rgba(255,204,0,0.15)" : "rgba(255,255,255,0.02)",
                      border: `1px solid ${selectedKfIndex === ki ? "rgba(255,204,0,0.3)" : "rgba(255,255,255,0.06)"}`,
                      display: "flex",
                      justifyContent: "space-between",
                      fontSize: "9px",
                      fontFamily: "monospace",
                      cursor: "pointer",
                    }}
                  >
                    <span style={{ color: "#ffcc00" }}>t={kf.time.toFixed(2)}s</span>
                    <span style={{ color: "#aaa" }}>v={kf.value.toFixed(2)}</span>
                    <span style={{ color: "#666" }}>{kf.ease}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* キーフレーム編集 */}
          {selectedKf && (
            <div style={{ padding: "4px", background: "rgba(255,204,0,0.05)", border: "1px solid rgba(255,204,0,0.2)", marginBottom: "6px" }}>
              <div style={{ fontSize: "9px", color: "#ffcc00", fontFamily: "monospace", marginBottom: "4px" }}>Edit Keyframe</div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
                  Time:
                  <input
                    type="number"
                    value={selectedKf.time}
                    onChange={(e) => handleUpdateKf("time", e.target.value)}
                    step={0.1}
                    min={0}
                    style={{
                      width: "50px",
                      marginLeft: "2px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e0e0e0",
                      padding: "1px 2px",
                      fontSize: "9px",
                      fontFamily: "monospace",
                      textAlign: "right",
                    }}
                  />
                </label>
                <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
                  Value:
                  <input
                    type="number"
                    value={selectedKf.value}
                    onChange={(e) => handleUpdateKf("value", e.target.value)}
                    step={0.01}
                    min={0}
                    max={1}
                    style={{
                      width: "50px",
                      marginLeft: "2px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e0e0e0",
                      padding: "1px 2px",
                      fontSize: "9px",
                      fontFamily: "monospace",
                      textAlign: "right",
                    }}
                  />
                </label>
                <label style={{ fontSize: "9px", color: "#888", fontFamily: "monospace" }}>
                  Ease:
                  <input
                    type="text"
                    value={selectedKf.ease}
                    onChange={(e) => handleUpdateKf("ease", e.target.value)}
                    style={{
                      width: "80px",
                      marginLeft: "2px",
                      background: "rgba(0,0,0,0.3)",
                      border: "1px solid rgba(255,255,255,0.1)",
                      color: "#e0e0e0",
                      padding: "1px 2px",
                      fontSize: "9px",
                      fontFamily: "monospace",
                    }}
                  />
                </label>
              </div>
            </div>
          )}
        </>
      )}

      {/* タイムライン可視化 */}
      {selectedTimeline && selectedTrack && (
        <div style={{ marginBottom: "6px" }}>
          <div style={{ fontSize: "9px", color: "#888", fontFamily: "monospace", marginBottom: "2px" }}>Preview</div>
          <div
            style={{
              position: "relative",
              height: "24px",
              background: "rgba(0,0,0,0.3)",
              border: "1px solid rgba(255,255,255,0.1)",
              overflow: "hidden",
            }}
          >
            {/* 時間軸グリッド */}
            {Array.from({ length: Math.ceil(totalDuration) + 1 }).map((_, i) => (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${(i / Math.max(totalDuration, 1)) * 100}%`,
                  top: 0,
                  bottom: 0,
                  width: "1px",
                  background: "rgba(255,255,255,0.1)",
                }}
              />
            ))}
            {/* キーフレームマーカー */}
            {selectedTrack.keyframes.map((kf, ki) => (
              <div
                key={ki}
                onClick={() => setSelectedKfIndex(ki)}
                style={{
                  position: "absolute",
                  left: `${(kf.time / Math.max(totalDuration, 1)) * 100}%`,
                  top: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: selectedKfIndex === ki ? "#ffcc00" : "#888",
                  border: "1px solid #000",
                  cursor: "pointer",
                  zIndex: 1,
                }}
                title={`t=${kf.time.toFixed(2)} v=${kf.value.toFixed(2)}`}
              />
            ))}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: "8px", color: "#555", fontFamily: "monospace" }}>
            <span>0s</span>
            <span>{totalDuration}s</span>
          </div>
        </div>
      )}
    </PanelShell>
  );
}

function PanelShell({
  title,
  panelId,
  isCollapsed,
  onToggle,
  children,
}: {
  title: string;
  panelId: string;
  isCollapsed: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: "rgba(20, 20, 30, 0.9)",
        border: "1px solid rgba(255,255,255,0.1)",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => onToggle(panelId)}
        style={{
          padding: "4px 8px",
          cursor: "pointer",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          background: "rgba(30, 30, 40, 0.8)",
          borderBottom: isCollapsed ? "none" : "1px solid rgba(255,255,255,0.1)",
          fontSize: "11px",
          fontWeight: "bold",
          userSelect: "none",
        }}
      >
        <span>{title}</span>
        <span>{isCollapsed ? "▶" : "▼"}</span>
      </div>
      {!isCollapsed && <div style={{ padding: "6px 8px" }}>{children}</div>}
    </div>
  );
}