import React, { useRef, useEffect } from "react";
import "./Window.css";

interface WindowProps {
  id: string;
  children?: any;
  height: number;
  width: number;
  top?: number;
  left?: number;
  resizable?: boolean;
  minimized_width?: number;
  titleBar?: {
    icon?: string | HTMLImageElement;
    title?: string;
    buttons?: {
      minimize?: boolean;
      maximize?: boolean;
      close?: () => void;
    };
  };
  style?: React.CSSProperties;
}

const nextZIndex: () => number = () => {
  let maxZ = 0;
  for (let w of document.querySelectorAll<HTMLDivElement>(
    ".window-container"
  )) {
    let z = parseInt(w.style.zIndex);

    maxZ = Math.max(isNaN(z) ? 0 : z, maxZ);
  }
  return maxZ + 1;
};

const Window: React.FC<WindowProps> = (props: WindowProps) => {
  let properties = Object.assign(
    {
      id: props.id && props.id.length ? props.id : Date.now().toString(),
      children: null,
      height: 0,
      width: 0,
      top: 0,
      left: 0,
      resizable: false,
      minimized: false,
      setMinimized: (arg: boolean) => {arg},
      minimized_width: 280,
      titleBar: Object.assign(
        {
          icon: " ",
          title: "Untitled window",
          buttons: Object.assign(
            {
              minimize: true,
              maximize: true,
              close: true,
            },
            (props.titleBar && props.titleBar.buttons) || {}
          ),
        },
        props.titleBar
      ),
      style: {},
    },
    props
  );

  if (!properties.id) {
    properties.id = Date.now().toString();
  }

  Object.freeze(properties);

  const [height, setHeight] = React.useState(properties.height);
  const [width, setWidth] = React.useState(properties.width);
  const [top, setTop] = React.useState<number>(properties.top || 0);
  const [left, setLeft] = React.useState<number>(properties.left || 0);
  const [xOffset, setXOffset] = React.useState<number>(0);
  const [yOffset, setYOffset] = React.useState<number>(0);
  const [maximized, setMaximized] = React.useState<boolean>(false);
  const [minimizeIcon, setMinimizeIcon] = React.useState<string>("▁");
  const [maximizeIcon, setMaximizeIcon] = React.useState<string>("□");
  const [contentDisplay, setContentDisplay] = React.useState<boolean>(true);
  const [windowTransition, setWindowTransition] = React.useState("");
  const [level, setLevel] = React.useState<number>(nextZIndex());
  const [visibility, setWindowVisibility] = React.useState<number>(1.0);

  const container = React.useRef<HTMLDivElement>(null);
  const windowTitle = React.useRef<HTMLSpanElement>(null);
  const effectiveHeight = useRef(height);
  const effectiveWidth = useRef(width);

  const animationDuration = 500;

  const handleDragStart = (e: React.DragEvent<HTMLSpanElement>) => {
    setYOffset(e.clientY - top);
    setXOffset(e.clientX - left);
    setLevel(nextZIndex());
    setWindowVisibility(0.5);
  };

  const handleDrag = (e: MouseEvent | React.MouseEvent) => {
    setLeft((e.clientX || e.screenX || left + xOffset) - xOffset);
    setTop((e.clientY || e.screenY || top + yOffset) - yOffset);
  };

  const handleDragEnd = (e: React.DragEvent<HTMLSpanElement>) => {
    setLeft((e.clientX || e.screenX) - xOffset);
    setTop((e.clientY || e.screenY) - yOffset);
    setWindowVisibility(1.0);
  };

  const minimize = (animate=true) => {
    if (animate) setWindowTransition(`${animationDuration}ms ease-in-out`);
    const parent = document.getElementById(properties.id)?.parentElement;
    if (!properties.minimized) {
      setContentDisplay(true);
      effectiveHeight.current = height;
      effectiveWidth.current = width;
      setTop(properties.top || 0);
      setLeft(properties.left || 0);
      setMinimizeIcon("▁");
      setMaximized(false);
    } else {
      setContentDisplay(false);
      effectiveHeight.current = 32;
      const parent = document.getElementById(properties.id)?.parentElement;
      effectiveWidth.current = props.minimized_width || 32;
      let topPosition =
        (parent?.clientHeight || window.innerHeight) -
        effectiveHeight.current -
        4;

      let leftPosition =
        (parent?.clientWidth || document.documentElement.clientWidth) - effectiveWidth.current - 4;

      const minimizedWindow = document.elementFromPoint(
        leftPosition + effectiveWidth.current / 2,
        topPosition + effectiveHeight.current / 2
      ) as HTMLDivElement;
      if (
        minimizedWindow &&
        ["window-container", "windowTitle"].includes(
          minimizedWindow?.className || ""
        )
      ) {
        topPosition -= minimizedWindow?.clientHeight + 4;
      }

      setTop(topPosition);
      setLeft(leftPosition);
      setMinimizeIcon("◰");
      setMaximized(false);
    }
    setLevel(nextZIndex());
    setTimeout(setWindowTransition, animationDuration + 1, "");
  };

  const maximize = () => {
    const parent = document.getElementById(properties.id)?.parentElement;
    if (maximized) {
      setContentDisplay(true);
      effectiveHeight.current = height;
      effectiveWidth.current = width;
      setTop(parent?.offsetTop || 0);
      setLeft(parent?.offsetLeft || 0);
      setMaximized(false);
      setMaximizeIcon("□");
      setMinimizeIcon("▁");
    } else {
      setContentDisplay(true);
      effectiveHeight.current = parent?.clientHeight || window.innerHeight;
      effectiveWidth.current = parent?.clientWidth || window.innerWidth;
      setTop(parent?.offsetTop || 0);
      setLeft(parent?.offsetLeft || 0);
      setMaximized(true);
      setMaximizeIcon("❐");
      setMinimizeIcon("▁");
    }
    setLevel(nextZIndex());
  };

  const [transitionCount, setTransitionCount] = React.useState(0)

  useEffect(() => {
    minimize(transitionCount > 0)
    setTransitionCount(transitionCount + 1)
  }, [properties.minimized])

  return (
    <div
      id={properties.id}
      className="window-container"
      style={{
        height: effectiveHeight.current,
        width: effectiveWidth.current,
        top,
        left,
        resize: properties.resizable ? "both" : "none",
        transition: windowTransition,
        zIndex: level,
        opacity: visibility,
      }}
      ref={container}
      onClick={() => {
        setLevel(nextZIndex());
      }}
    >
      {properties.titleBar && (
        <div
          className="title-bar"
          data-parent={properties.id}
          style={{
            opacity: visibility,
          }}
        >
          {properties.titleBar.icon && (
            <span className="icon">{properties.titleBar.icon}</span>
          )}
          <span
            className="windowTitle"
            draggable={true}
            onDragStart={handleDragStart}
            onDrag={handleDrag}
            onDragEnd={handleDragEnd}
            style={{ opacity: Math.floor(visibility) }}
            ref={windowTitle}
          >
            {properties.titleBar.title}
          </span>
          {properties.titleBar.buttons && (
            <span className="buttonContainer">
              {properties.titleBar.buttons.minimize && (
                <span className="windowButton" onClick={() => {properties.setMinimized && properties.setMinimized(!properties.minimized)}}>
                  {minimizeIcon}
                </span>
              )}
              {properties.titleBar.buttons.maximize && (
                <span className="windowButton" onClick={maximize}>
                  {maximizeIcon}
                </span>
              )}
              {!!properties.titleBar.buttons.close && (
                <span
                  className="windowButton"
                  onClick={properties.titleBar.buttons.close}
                >
                  &#10799;
                </span>
              )}
            </span>
          )}
        </div>
      )}
      <div
        className="content"
        draggable="false"
        style={{
          height: contentDisplay ? "auto" : 0,
          opacity: visibility,
          ...properties.style,
        }}
      >
        {properties.children}
      </div>
    </div>
  );
};

export default Window;
