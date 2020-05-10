import React, { ReactNode } from "react";
import { Dimensions, StyleSheet, View } from "react-native";
import Animated, {
  Value,
  and,
  block,
  cond,
  eq,
  max,
  multiply,
  set,
  sub,
  useCode,
} from "react-native-reanimated";
import {
  PanGestureHandler,
  PinchGestureHandler,
  State,
} from "react-native-gesture-handler";
import {
  Vector,
  clamp,
  onGestureEvent,
  pinchActive,
  pinchBegan,
  timing,
  vec,
} from "react-native-redash";

const { width, height } = Dimensions.get("window");
export const CANVAS = vec.create(width, height);
const CENTER = vec.divide(CANVAS, 2);
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "black",
  },
});

interface PinchGestureProps {
  panState: Animated.Value<number>;
  scale: Animated.Value<number>;
  translate: Vector<Animated.Value<number>>;
  children: ReactNode;
}

const PinchGesture = ({
  children,
  scale,
  translate,
  panState,
}: PinchGestureProps) => {
  const origin = vec.createValue(0);
  const focal = vec.createValue(0);
  const gestureScale = new Value(1);
  const numberOfPointers = new Value(0);
  const pinchState = new Value(State.END);
  const pinchGestureHandler = onGestureEvent({
    numberOfPointers,
    scale: gestureScale,
    state: pinchState,
    focalX: focal.x,
    focalY: focal.y,
  });

  const pan = vec.createValue(0);
  const panGestureHandler = onGestureEvent({
    translationX: pan.x,
    translationY: pan.y,
    state: panState,
  });

  const scaleOffset = new Value(1);
  const minVec = vec.min(vec.multiply(-0.5, CANVAS, sub(scale, 1)), 0);
  const maxVec = vec.max(vec.minus(minVec), 0);
  const offset = vec.createValue(0);
  const translation = vec.createValue(0);
  const adjustedFocal = vec.sub(focal, vec.add(CENTER, offset));
  useCode(
    () =>
      block([
        cond(eq(panState, State.ACTIVE), vec.set(translation, pan)),
        cond(pinchBegan(pinchState), vec.set(origin, adjustedFocal)),
        cond(pinchActive(pinchState, numberOfPointers), [
          vec.set(
            translation,
            vec.add(
              vec.sub(adjustedFocal, origin),
              origin,
              vec.multiply(-1, gestureScale, origin)
            )
          ),
        ]),
        cond(and(eq(pinchState, State.END), eq(panState, State.END)), [
          vec.set(offset, vec.add(offset, translation)),
          set(scaleOffset, scale),
          set(gestureScale, 1),
          vec.set(translation, 0),
          vec.set(focal, 0),
          set(
            offset.x,
            timing({
              from: offset.x,
              to: clamp(offset.x, minVec.x, maxVec.x),
            })
          ),
          set(
            offset.y,
            timing({
              from: offset.y,
              to: clamp(offset.y, minVec.y, maxVec.y),
            })
          ),
          set(
            scaleOffset,
            timing({ from: scaleOffset, to: max(scaleOffset, 1) })
          ),
        ]),
        set(scale, multiply(gestureScale, scaleOffset)),
        vec.set(translate, vec.add(offset, translation)),
      ]),
    [
      adjustedFocal,
      focal,
      gestureScale,
      maxVec.x,
      maxVec.y,
      minVec.x,
      minVec.y,
      numberOfPointers,
      offset,
      origin,
      pan,
      panState,
      pinchState,
      scale,
      scaleOffset,
      translate,
      translation,
    ]
  );
  return (
    <View style={styles.container}>
      <PinchGestureHandler {...pinchGestureHandler}>
        <Animated.View style={StyleSheet.absoluteFillObject}>
          <PanGestureHandler {...panGestureHandler}>
            <Animated.View style={StyleSheet.absoluteFill}>
              {children}
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </PinchGestureHandler>
    </View>
  );
};

export default PinchGesture;
