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
            "group toast group-[.toaster]:bg-gray-900 group-[.toaster]:text-white group-[.toaster]:border-gray-700 group-[.toaster]:shadow-xl",
          description: "group-[.toast]:text-gray-200",
          actionButton:
            "group-[.toast]:bg-white group-[.toast]:text-gray-900 group-[.toast]:hover:bg-gray-100",
          cancelButton:
            "group-[.toast]:bg-gray-700 group-[.toast]:text-gray-200 group-[.toast]:hover:bg-gray-600",
          success: "group-[.toaster]:bg-green-600 group-[.toaster]:text-white group-[.toaster]:border-green-500",
          error: "group-[.toaster]:bg-red-600 group-[.toaster]:text-white group-[.toaster]:border-red-500",
          warning: "group-[.toaster]:bg-yellow-600 group-[.toaster]:text-white group-[.toaster]:border-yellow-500",
          info: "group-[.toaster]:bg-blue-600 group-[.toaster]:text-white group-[.toaster]:border-blue-500",
        },
      }}
      {...props}
    />
  )
}

export { Toaster, toast }
