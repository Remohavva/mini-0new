import { useMemo } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

type Props = {
  value: number;
  onChange?: (v: number) => void;
  size?: "sm" | "md" | "lg";
  readonly?: boolean;
};

export default function RatingStars({ value, onChange, size = "md", readonly = false }: Props) {
  const fontSize = useMemo(() => {
    if (size === "sm") return 18;
    if (size === "lg") return 34;
    return 24;
  }, [size]);

  return (
    <View style={styles.row}>
      {[1, 2, 3, 4, 5].map((star) => {
        const active = star <= value;
        const color = active ? "#f59e0b" : "#d1d5db";
        return (
          <TouchableOpacity
            key={star}
            disabled={readonly}
            onPress={() => onChange?.(star)}
            style={styles.starBtn}
            activeOpacity={0.8}
          >
            <Text style={[styles.starText, { fontSize, color }]}>{active ? "★" : "☆"}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row" },
  starBtn: { paddingVertical: 2, paddingHorizontal: 2, marginRight: 4 },
  starText: { fontWeight: "800" },
});

