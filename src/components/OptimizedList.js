import React, { useMemo } from "react";
import { FlatList, View, StyleSheet } from "react-native";
import Animated, {
  FadeInUp,
  Layout,
} from "react-native-reanimated";

/**
 * OptimizedList component with:
 * - Smooth item entry animations
 * - Layout transitions
 * - Pagination support
 * - Empty state handling
 */
export default function OptimizedList({
  data = [],
  renderItem,
  keyExtractor = (item, i) => String(i),
  contentContainerStyle,
  refreshControl,
  ListEmptyComponent,
  itemAnimationDelay = 50,
  isLoading = false,
  ...props
}) {
  // Animate items staggered
  const animatedRenderItem = ({ item, index }) => (
    <Animated.View
      entering={FadeInUp.delay(index * itemAnimationDelay)}
      layout={Layout.springify()}
    >
      {renderItem({ item, index })}
    </Animated.View>
  );

  if (isLoading) {
    return <View style={{ flex: 1 }} />;
  }

  return (
    <FlatList
      data={data}
      renderItem={animatedRenderItem}
      keyExtractor={keyExtractor}
      contentContainerStyle={contentContainerStyle}
      refreshControl={refreshControl}
      ListEmptyComponent={ListEmptyComponent}
      scrollEventThrottle={16}
      removeClippedSubviews={true}
      maxToRenderPerBatch={10}
      updateCellsBatchingPeriod={50}
      {...props}
    />
  );
}

const styles = StyleSheet.create({});
