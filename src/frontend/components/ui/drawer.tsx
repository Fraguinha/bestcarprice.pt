import * as React from "react";
import { Drawer as DrawerPrimitive } from "vaul";
import { cn } from "@/lib/utils";

const DrawerContext = React.createContext<{ direction?: "bottom" | "right" }>({});

const Drawer = ({
  shouldScaleBackground = false,
  direction = "bottom",
  ...props
}: React.ComponentProps<typeof DrawerPrimitive.Root> & { direction?: "bottom" | "right" }) => (
  <DrawerContext.Provider value={{ direction }}>
    <DrawerPrimitive.Root shouldScaleBackground={shouldScaleBackground} direction={direction} {...props} />
  </DrawerContext.Provider>
);

const DrawerTrigger = DrawerPrimitive.Trigger;
const DrawerClose = DrawerPrimitive.Close;
const DrawerPortal = DrawerPrimitive.Portal;

const DrawerOverlay = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Overlay>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Overlay>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Overlay
    ref={ref}
    className={cn("fixed inset-0 z-50 bg-black/80", className)}
    {...props}
  />
));
DrawerOverlay.displayName = DrawerPrimitive.Overlay.displayName;

const DrawerContent = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Content>
>(({ className, children, ...props }, ref) => {
  const { direction } = React.useContext(DrawerContext);
  const isRight = direction === "right";

  return (
    <DrawerPortal>
      <DrawerOverlay />
      <DrawerPrimitive.Content
        ref={ref}
        className={cn(
          "fixed z-50 flex bg-background",
          isRight
            ? "inset-y-0 right-0 w-3/4 sm:max-w-sm flex-col rounded-l-2xl"
            : "inset-x-0 bottom-0 mt-24 h-auto flex-col rounded-t-2xl",
          className
        )}
        {...props}
      >
        {isRight ? (
          <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-12 rounded-full bg-muted-foreground/20" />
        ) : (
          <div className="mx-auto mt-4 h-1.5 w-12 rounded-full bg-muted-foreground/20" />
        )}
        {children}
      </DrawerPrimitive.Content>
    </DrawerPortal>
  );
});
DrawerContent.displayName = "DrawerContent";

const DrawerTitle = React.forwardRef<
  React.ElementRef<typeof DrawerPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DrawerPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DrawerPrimitive.Title
    ref={ref}
    className={cn("text-lg font-semibold text-foreground", className)}
    {...props}
  />
));
DrawerTitle.displayName = DrawerPrimitive.Title.displayName;

export {
  Drawer,
  DrawerPortal,
  DrawerOverlay,
  DrawerTrigger,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
};
