"use client";

import * as z from "zod";
import axios from "axios";
import { Code, Copy } from "lucide-react";
import { useForm } from "react-hook-form";
import { useState } from "react";
import { toast } from "react-hot-toast";
import ReactMarkdown from "react-markdown";
import { useRouter } from "next/navigation";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { dracula } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { cn } from "@/lib/utils";
import { Loader } from "@/components/loader";
import { UserAvatar } from "@/components/user-avatar";
import { BotAvatar } from "@/components/bot-avatar";
import { Empty } from "@/components/ui/empty";
import { useProModal } from "@/hooks/use-pro-modal";
import { formSchema } from "./constants";

const CodePage = () => {
  const router = useRouter();
  const proModal = useProModal();
  const [messages, setMessages] = useState<any[]>([]);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      const userMessage = { role: "user", content: values.prompt };
      const newMessages = [...messages, userMessage];

      const response = await axios.post("/api/code", { messages: newMessages });

      if (response.status === 401) {
        toast.error("Unauthorized. Please log in.");
        return;
      }
      if (response.status === 403) {
        proModal.onOpen();
        return;
      }
      if (response.status === 500) {
        toast.error("Internal server error.");
        return;
      }

      setMessages((current) => [...current, userMessage, response.data]);
      form.reset();
    } catch (error) {
      toast.error("Something went wrong.");
    } finally {
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="Code Generation"
        description="Generate high-quality code snippets with AI"
        icon={Code}
        iconColor="text-green-700"
        bgColor="bg-green-700/10"
      />
      <div className="px-4 lg:px-8">
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="rounded-lg border w-full p-4 px-3 md:px-6 focus-within:shadow-sm grid grid-cols-12 gap-2"
          >
            <FormField
              name="prompt"
              render={({ field }) => (
                <FormItem className="col-span-12 lg:col-span-10">
                  <FormControl>
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      disabled={isLoading}
                      placeholder="Describe the code you need..."
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            <Button
              className="col-span-12 lg:col-span-2 w-full"
              type="submit"
              disabled={isLoading}
              size="icon"
            >
              Generate
            </Button>
          </form>
        </Form>

        <div className="space-y-4 mt-4">
          {isLoading && (
            <div className="p-8 rounded-lg w-full flex items-center justify-center bg-gray-100">
              <Loader />
            </div>
          )}
          {messages.length === 0 && !isLoading && <Empty label="No code generated yet." />}
          <div className="flex flex-col-reverse gap-y-4">
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "p-8 w-full flex items-start gap-x-4 rounded-lg shadow-sm",
                  message.role === "user" ? "bg-white border border-gray-200" : "bg-gray-100"
                )}
              >
                {message.role === "user" ? <UserAvatar /> : <BotAvatar />}
                <ReactMarkdown
                  components={{
                    pre: ({ children }) => <>{children}</>,
                    code: ({ className, children }) => {
                      const language = className?.replace("language-", "") || "javascript";
                      return (
                        <CodeBlock language={language}>
                          {String(children).trim()}
                        </CodeBlock>
                      );
                    },
                  }}
                  className="text-sm overflow-hidden leading-7"
                >
                  {message.content || ""}
                </ReactMarkdown>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// CodeBlock Component for styling the generated code
const CodeBlock = ({ language, children }: { language?: string; children: string }) => {
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    toast.success("Copied to clipboard!");
  };

  return (
    <div className="relative bg-[#1E1E1E] text-white rounded-lg overflow-hidden shadow-lg border border-gray-700">
      {/* Copy Button */}
      <Button
        onClick={handleCopy}
        variant="ghost"
        size="sm"
        className="absolute top-2 right-2 text-gray-400 hover:text-white"
      >
        <Copy size={16} />
      </Button>

      {/* Code Highlighting */}
      <SyntaxHighlighter language={language || "javascript"} style={dracula} wrapLines>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

export default CodePage;
