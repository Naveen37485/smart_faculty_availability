// ============================================================
//  RoomCard — Reusable room card for Faculty and Student views
//
//  Props:
//    room       : { room_no, class, section, faculty_assigned,
//                   assigned_to_library, students_present }
//    selected   : boolean – is this card currently selected?
//    onClick    : function – called when a free card is clicked
//    clickable  : boolean – allow clicking (false for student view)
// ============================================================

import React from "react";

export default function RoomCard({ room, selected = false, onClick, clickable = true }) {
  // Determine room state based on students and faculty presence
  const isAttended = room.students_present && room.faculty_assigned;
  const isUnattended = room.students_present && !room.faculty_assigned;
  const isEmpty = !room.students_present;

  // Determine CSS class
  let cardClass = "room-card ";
  if (selected) {
    cardClass += "room-card-selected";
  } else if (isAttended) {
    cardClass += "room-card-attended";
  } else if (isUnattended) {
    cardClass += "room-card-unattended";
  } else if (isEmpty) {
    cardClass += "room-card-empty";
  }

  const handleClick = () => {
    if (clickable && onClick) {
      onClick(room);
    }
  };

  // Status label
  const statusLabel = selected
    ? "Selected"
    : isAttended
    ? "Attended"
    : isUnattended
    ? "Unattended"
    : "Empty";

  return (
    <div
      id={`room-card-${room.room_no}`}
      className={cardClass}
      onClick={handleClick}
      title={
        clickable && !selected
          ? `Room ${room.room_no} — ${statusLabel} (click to select)`
          : `Room ${room.room_no} — ${statusLabel}`
      }
      role={clickable ? "button" : undefined}
      tabIndex={clickable ? 0 : undefined}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") handleClick();
      }}
    >
      {/* Room number */}
      <div style={{ fontSize: "1.4rem", fontWeight: 800, lineHeight: 1 }}>
        {room.room_no}
      </div>

      {/* Small label */}
      <div
        style={{
          fontSize:   "0.65rem",
          fontWeight: 600,
          marginTop:  "0.4rem",
          opacity:    0.8,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
        }}
      >
        {statusLabel}
      </div>

      {/* Class + Section if available */}
      {(room.class || room.section) && (
        <div
          style={{
            fontSize:   "0.6rem",
            opacity:    0.6,
            marginTop:  "0.2rem",
          }}
        >
          {room.class} {room.section}
        </div>
      )}

      {/* Status dot */}
      <div
        style={{
          position: "absolute",
          top:      "0.5rem",
          right:    "0.5rem",
          width:    "8px",
          height:   "8px",
          borderRadius: "50%",
          background: selected
            ? "var(--primary-light)"
            : isAttended
            ? "#10b981"
            : isUnattended
            ? "#ef4444"
            : "#f59e0b",
        }}
      />
    </div>
  );
}
