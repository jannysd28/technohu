import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { insertProjectSchema } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { Upload, Play, ShieldCheck, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const uploadProjectSchema = insertProjectSchema.omit({ 
  sellerId: true,
  createdAt: true,
  thumbnails: true,
}).extend({
  price: z.coerce.number().min(1, "Price must be at least $1"),
  title: z.string().min(1, "Title is required"),
});

type UploadProjectFormData = z.infer<typeof uploadProjectSchema>;

export default function UploadProject() {
  const { user } = useAuth();
  const [_, navigate] = useLocation();
  const { toast } = useToast();

  // Use effect to check if user is a verified seller
  useEffect(() => {
    if (user && user.status !== "verified") {
      toast({
        title: "Verification Required",
        description: "You need to be a verified seller to upload projects.",
        variant: "destructive",
      });
      navigate("/seller-dashboard");
    }
  }, [user, navigate, toast]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewContent, setPreviewContent] = useState<string>("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);

  const form = useForm<UploadProjectFormData>({
    resolver: zodResolver(uploadProjectSchema),
    defaultValues: {
      title: "",
      description: "",
      price: 0,
      commandInputs: "",
      languageTags: "",
      filePath: "",
      projectType: "web",
    },
  });

  const uploadMutation = useMutation({
    mutationFn: async (data: UploadProjectFormData) => {
      // Convert price to cents for storage
      const dataToSend = { 
        ...data, 
        price: data.price * 100,
        sellerId: user!.id,
      };

      const res = await apiRequest("POST", "/api/projects", dataToSend);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/projects"] });
      toast({
        title: "Project uploaded",
        description: "Your project has been successfully uploaded.",
      });
      navigate("/seller-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: UploadProjectFormData) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file or folder to upload.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, we would upload the file first, get the path, and then submit the form
    // For this demo, we'll just use the file name as the path
    const updatedData = {
      ...data,
      filePath: selectedFile.name,
    };

    uploadMutation.mutate(updatedData);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const runPreview = async () => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a file to preview.",
        variant: "destructive",
      });
      return;
    }

    setPreviewOpen(true);
    setPreviewLoading(true);
    setPreviewError(null);

    try {
      // Read the file content
      const reader = new FileReader();

      reader.onload = (event) => {
        if (event.target?.result) {
          // Process based on file type
          const projectType = form.getValues('projectType');
          const fileContent = event.target.result as string;
          let content = '';

          try {
            // Simulate running different types of projects
            if (projectType === 'cli') {
              const commandInputs = form.getValues('commandInputs');
              content = `Running CLI preview for ${selectedFile.name}:\n\n`;
              content += `Command: ${commandInputs || 'No command specified'}\n\n`;
              content += `Output:\n${generatePreviewOutput(fileContent, projectType)}\n`;
            } else if (projectType === 'gui') {
              content = `GUI Application Preview: ${selectedFile.name}\n\n`;
              content += `[Window Title: ${form.getValues('title') || 'Untitled'}]\n\n`;
              content += `Preview of GUI application is generated. This is a simulation as actual GUI rendering \nwould require a runtime environment.\n\n`;
              content += generatePreviewOutput(fileContent, projectType);
            } else { // web
              content = `Web Application Preview: ${selectedFile.name}\n\n`;
              content += `[Browser Window: ${form.getValues('title') || 'Untitled'}]\n\n`;
              content += `Preview of web application is generated. This preview would be an iframe \nof the actual web application in production.\n\n`;
              content += generatePreviewOutput(fileContent, projectType);
            }

            setPreviewContent(content);
          } catch (error) {
            if (error instanceof Error) {
              setPreviewError(`Error generating preview: ${error.message}`);
            } else {
              setPreviewError('An unknown error occurred while generating the preview');
            }
          }
        }
        setPreviewLoading(false);
      };

      reader.onerror = () => {
        setPreviewError('Failed to read the file');
        setPreviewLoading(false);
      };

      reader.readAsText(selectedFile);
    } catch (error) {
      if (error instanceof Error) {
        setPreviewError(`Error during preview: ${error.message}`);
      } else {
        setPreviewError('An unknown error occurred');
      }
      setPreviewLoading(false);
    }
  };

  const generatePreviewOutput = (fileContent: string, projectType: string): string => {
    try {
      if (fileContent.length > 5000) {
        fileContent = fileContent.substring(0, 5000) + '\n... (content truncated for preview)';
      }

      // Actual code analysis
      const lines = fileContent.split('\n').length;
      const functions = (fileContent.match(/function\s+\w+\s*\(|const\s+\w+\s*=\s*\(|=>\s*{/g) || []).length;
      const classes = (fileContent.match(/class\s+\w+/g) || []).length;

      let analysis = `Code Analysis:\n`;
      analysis += `- File size: ${fileContent.length} bytes\n`;
      analysis += `- Lines of code: ${lines}\n`;
      analysis += `- Functions/Methods: ${functions}\n`;
      analysis += `- Classes: ${classes}\n\n`;

      if (projectType === 'cli') {
        const imports = fileContent.match(/import\s+.*from|require\s*\(|include\s+/g) || [];
        analysis += `CLI Analysis:\n`;
        analysis += `- Dependencies: ${imports.length}\n`;
        analysis += `- Entry points detected: ${fileContent.includes('main(') || fileContent.includes('if __name__') ? 'Yes' : 'No'}\n`;
      } else if (projectType === 'gui') {
        const uiComponents = (fileContent.match(/window|frame|button|label|input|form|dialog|menu/gi) || []).length;
        analysis += `GUI Analysis:\n`;
        analysis += `- UI Components detected: ${uiComponents}\n`;
        analysis += `- Event handlers: ${(fileContent.match(/on\w+\s*=|addEventListener/g) || []).length}\n`;
      } else {
        const htmlTags = (fileContent.match(/<[a-z]+/gi) || []).length;
        const cssRules = (fileContent.match(/{[^}]+}/g) || []).length;
        const jsPatterns = (fileContent.match(/function|=>|var|let|const/g) || []).length;

        analysis += `Web Analysis:\n`;
        analysis += `- HTML Elements: ${htmlTags}\n`;
        analysis += `- CSS Rules: ${cssRules}\n`;
        analysis += `- JavaScript Patterns: ${jsPatterns}\n`;
        analysis += `- Framework Detection: ${
          fileContent.includes('React') ? 'React' :
          fileContent.includes('Vue') ? 'Vue' :
          fileContent.includes('Angular') ? 'Angular' : 'None detected'
        }`;
      }

      return analysis;
    } catch (error) {
      return `Error in analysis: ${error instanceof Error ? error.message : 'Unknown error'}`;
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-grow bg-slate-50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="md:flex md:items-center md:justify-between mb-8">
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:text-3xl sm:truncate">
                Upload New Project
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Share your code, GUI apps, or web applications with potential buyers.
              </p>
            </div>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8 divide-y divide-gray-200">
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Provide details about your project to help buyers understand its value.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-4">
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., Web Scraper Script, Stock Analysis Dashboard" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="description"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-6">
                            <FormLabel>Description</FormLabel>
                            <FormControl>
                              <Textarea 
                                rows={4} 
                                placeholder="Describe what your project does, its features, and who it might be valuable for..."
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Price (USD)</FormLabel>
                            <FormControl>
                              <div className="relative rounded-md shadow-sm">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                  <span className="text-gray-500 sm:text-sm">$</span>
                                </div>
                                <Input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  placeholder="0.00"
                                  className="pl-7"
                                  {...field}
                                />
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="languageTags"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Language Tags</FormLabel>
                            <FormControl>
                              <Input placeholder="Python, JavaScript, React, etc." {...field} />
                            </FormControl>
                            <FormDescription>
                              Separate tags with commas
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="projectType"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-3">
                            <FormLabel>Project Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a project type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="cli">CLI Tool</SelectItem>
                                <SelectItem value="gui">GUI Application</SelectItem>
                                <SelectItem value="web">Web Application</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="commandInputs"
                        render={({ field }) => (
                          <FormItem className="sm:col-span-6">
                            <FormLabel>Command Inputs (if applicable)</FormLabel>
                            <FormControl>
                              <Input placeholder="E.g., python main.py --input file.csv" {...field} />
                            </FormControl>
                            <FormDescription>
                              How to run your CLI tool or application from the command line
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>

                  <div className="pt-6 space-y-6">
                    <div>
                      <h3 className="text-lg leading-6 font-medium text-gray-900">Project Files</h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload your project files. We'll automatically detect dependencies.
                      </p>
                    </div>

                    <div className="sm:col-span-6">
                      <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <div className="flex text-sm text-gray-600">
                            <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-blue-500">
                              <span>Upload a file</span>
                              <input 
                                id="file-upload" 
                                name="file-upload" 
                                type="file" 
                                className="sr-only"
                                onChange={handleFileChange}
                              />
                            </label>
                            <p className="pl-1">or drag and drop</p>
                          </div>
                          <p className="text-xs text-gray-500">
                            Individual files or entire folders up to 100MB
                          </p>
                          {selectedFile && (
                            <p className="text-xs text-green-600 font-medium">
                              Selected: {selectedFile.name}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="pt-5 mt-8">
                    <div className="flex justify-between">
                      <div className="flex">
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex items-center mr-3"
                          onClick={() => {
                            toast({
                              title: "Optional Security",
                              description: "Security scan is optional",
                            });
                          }}
                        >
                          <ShieldCheck className="mr-2 h-4 w-4" />
                          Optional Security Scan
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          className="flex items-center" 
                          onClick={runPreview}
                          disabled={!selectedFile}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Run Preview
                        </Button>
                      </div>
                      <Button 
                        type="submit" 
                        disabled={uploadMutation.isPending}
                        className="ml-3"
                      >
                        {uploadMutation.isPending ? (
                          <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                        ) : null}
                        Upload Project
                      </Button>
                    </div>
                  </div>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>Project Preview: {selectedFile?.name}</DialogTitle>
            <DialogDescription>
              This preview simulates how your code would run in a secure environment.
            </DialogDescription>
          </DialogHeader>

          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm overflow-auto max-h-[60vh]">
            {previewLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500"></div>
                <span className="ml-3">Generating preview...</span>
              </div>
            ) : previewError ? (
              <div className="text-red-500">
                <div className="font-bold mb-2">Error:</div>
                {previewError}
              </div>
            ) : (
              <pre className="whitespace-pre-wrap">{previewContent}</pre>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}