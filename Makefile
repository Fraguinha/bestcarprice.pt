.PHONY: all dev clean

all: dev

dev:
	@echo "Creating k3d cluster..."
	-@k3d cluster create stand -p "8080:80@loadbalancer" --registry-create k3d-stand-registry:10000 --wait

	@echo "Creating namespace..."
	@kubectl apply -f local/namespace.yml

	@echo "Creating secrets..."
	-@kubectl create secret generic stand-secrets -n stand \
		--from-literal=DATABASE=postgresql://stand:stand@host.docker.internal:5432/stand \
		--from-literal=SECRET=SECRET \
		--from-literal=S3_ENDPOINT=http://host.docker.internal:3900 \
		--from-literal=S3_ACCESS_KEY=test \
		--from-literal=S3_SECRET_KEY=test \
		--from-literal=S3_BUCKET=stand-images \
		--from-literal=S3_REGION=garage

	@echo "Building backend image..."
	@docker build --pull --no-cache -t fraguinha/stand-backend:latest src/backend

	@echo "Building frontend image..."
	@docker build --pull --no-cache -t fraguinha/stand-frontend:latest src/frontend

	@echo "Tagging backend image..."
	@docker tag fraguinha/stand-backend localhost:10000/fraguinha/stand-backend:latest

	@echo "Tagging frontend image..."
	@docker tag fraguinha/stand-frontend localhost:10000/fraguinha/stand-frontend:latest

	@echo "Pushing backend image..."
	@docker push localhost:10000/fraguinha/stand-backend:latest

	@echo "Pushing frontend image..."
	@docker push localhost:10000/fraguinha/stand-frontend:latest

	@echo "Applying kubernetes manifests..."
	@kubectl apply -k local/

	@echo "Rolling out deployments..."
	@kubectl rollout restart deployment/frontend -n stand
	@kubectl rollout restart deployment/backend -n stand

	@echo "Waiting for deployments to be successful..."
	@kubectl rollout status deployment/frontend -n stand
	@kubectl rollout status deployment/backend -n stand

	@echo "You can now access the application at http://localhost:8080"

clean:
	@echo "Cleaning docker resources..."
	@docker stop $$(docker ps -aq)
	@docker container prune -f
	@docker image prune -f
	@docker volume prune -af
	@docker network prune -f
