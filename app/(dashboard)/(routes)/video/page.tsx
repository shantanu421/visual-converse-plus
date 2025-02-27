"use client";
import { useState } from "react";
import axios from "axios";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "react-hot-toast";
import { FileVideo } from "lucide-react";
import { useRouter } from "next/navigation";

import { Heading } from "@/components/heading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem } from "@/components/ui/form";
import { Loader } from "@/components/loader";
import { Empty } from "@/components/ui/empty";
import { useProModal } from "@/hooks/use-pro-modal";

const formSchema = z.object({
  prompt: z.string().min(5, "Prompt text is required"),
});

const VideoPage = () => {
  const proModal = useProModal();
  const router = useRouter();
  const [videoUrl, setVideoUrl] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      prompt: "",
    },
  });

  const isLoading = form.formState.isSubmitting;

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setVideoUrl(null);

      const response = await axios.post(
        "/api/video",
        { prompt: values.prompt, dimension: "16:9" },
        { responseType: "blob" } // Ensure we get a binary response
      );


      if (!response.data || response.data.size === 0) {
        throw new Error("Received empty or invalid video data.");
      }

      // Check if the response is a valid video
      if (!response.headers["content-type"]?.includes("video/mp4")) {
        throw new Error("API returned non-video content. Check API response.");
      }

      // Convert Blob to URL
      const blob = new Blob([response.data], { type: "video/mp4" });
      const url = URL.createObjectURL(blob);

      setVideoUrl(url);
    } catch (error: any) {
      if (error?.response?.status === 403) {
        proModal.onOpen();
      }
      console.error("API Error:", error.message);
      toast.error("Something went wrong.");
    } finally {
      router.refresh();
    }
  };

  return (
    <div>
      <Heading
        title="AI Video Generator"
        description="Create videos using AI with Segmind."
        icon={FileVideo}
        iconColor="text-orange-700"
        bgColor="bg-orange-700/10"
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
                  <FormControl className="m-0 p-0">
                    <Input
                      className="border-0 outline-none focus-visible:ring-0 focus-visible:ring-transparent"
                      disabled={isLoading}
                      placeholder="Enter text prompt..."
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
            >
              Generate
            </Button>
          </form>
        </Form>

        {isLoading && (
          <div className="p-20">
            <Loader />
          </div>
        )}

        {!videoUrl && !isLoading && <Empty label="No video generated yet." />}

        {videoUrl && (
          <video
            controls
            className="w-full aspect-video mt-8 rounded-lg border bg-black"
          >
            <source src={videoUrl} type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        )}
      </div>
    </div>
  );
};

export default VideoPage;
