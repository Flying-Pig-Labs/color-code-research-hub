import { useTheme } from "next-themes"
import { Toaster as Sonner, toast } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      toastOptions={{
        classNames: {
          toast:
            "group toast group-[.toaster]:bg-white group-[.toaster]:text-gray-900 group-[.toaster]:border-gray-200 group-[.toaster]:shadow-lg",
          description: "group-[.toast]:text-gray-600",
          actionButton:
            "group-[.toast]:bg-blue-600 group-[.toast]:text-white group-[.toast]:hover:bg-blue-700",
          cancelButton:
            "group-[.toast]:bg-gray-100 group-[.toast]:text-gray-700 group-[.toast]:hover:bg-gray-200",
          success: "group-[.toaster]:bg-white group-[.toaster]:text-green-700 group-[.toaster]:border-green-200",
          error: "group-[.toaster]:bg-white group-[.toaster]:text-red-700 group-[.toaster]:border-red-200",
          warning: "group-[.toaster]:bg-white group-[.toaster]:text-yellow-700 group-[.toaster]:border-yellow-200",
          info: "group-[.toaster]:bg-white group-[.toaster]:text-blue-700 group-[.toaster]:border-blue-200",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
